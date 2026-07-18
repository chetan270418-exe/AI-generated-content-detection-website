import torch
import numpy as np
from transformers import GPT2LMHeadModel, GPT2Tokenizer

class PerplexityScorer:
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(PerplexityScorer, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
        
    def __init__(self):
        if self._initialized:
            return
        
        # Load a small GPT-2 model just for perplexity scoring
        print("Loading PerplexityScorer (gpt2)...")
        self.tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
        self.model = GPT2LMHeadModel.from_pretrained('gpt2')
        self.model.eval()
        self._initialized = True

    def compute_sentence_perplexity(self, sentence: str) -> float:
        if not sentence.strip():
            return 0.0
            
        encodings = self.tokenizer(sentence, return_tensors='pt')
        max_length = self.model.config.n_positions
        stride = 512
        
        input_ids = encodings.input_ids
        if input_ids.size(1) == 0:
            return 0.0
            
        seq_len = input_ids.size(1)
        
        nlls = []
        prev_end_loc = 0
        for begin_loc in range(0, seq_len, stride):
            end_loc = min(begin_loc + max_length, seq_len)
            trg_len = end_loc - prev_end_loc
            input_ids_chunk = input_ids[:, begin_loc:end_loc]
            target_ids = input_ids_chunk.clone()
            target_ids[:, :-trg_len] = -100
            
            with torch.no_grad():
                outputs = self.model(input_ids_chunk, labels=target_ids)
                neg_log_likelihood = outputs.loss
                
            if not torch.isnan(neg_log_likelihood):
                nlls.append(neg_log_likelihood)
                
            prev_end_loc = end_loc
            if end_loc == seq_len:
                break
                
        if not nlls:
            return 0.0
            
        ppl = torch.exp(torch.stack(nlls).mean()).item()
        return ppl

def compute_perplexity_scores(text: str) -> dict:
    """
    Computes perplexity and burstiness.
    AI text has lower perplexity and lower variance (burstiness).
    """
    scorer = PerplexityScorer()
    
    import re
    sentences = re.split(r'(?<=[.!?]) +', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
    
    # PERFORMANCE OPTIMIZATION: Only evaluate max 10 sentences to prevent CPU blocking
    if len(sentences) > 10:
        sentences = sentences[:10]
    
    if not sentences:
        sentences = [text[:512]] # truncate just in case
        
    perplexities = []
    for s in sentences:
        p = scorer.compute_sentence_perplexity(s)
        if p > 0:
            perplexities.append(p)
            
    if not perplexities:
        return {
            "perplexity_score": 0.5,
            "burstiness_score": 0.5,
            "avg_perplexity": 0.0,
            "sentence_perplexities": []
        }
        
    avg_perplexity = np.mean(perplexities)
    variance = np.var(perplexities)
    
    # Normalize to 0-1 for AI probability
    # AI tends to have perplexity < 50, human > 80. (Rough heuristic)
    ppl_score = max(0.0, min(1.0, 1.0 - (avg_perplexity / 100.0)))
    
    # Burstiness: variance. Lower variance -> AI
    burst_score = max(0.0, min(1.0, 1.0 - (variance / 1000.0)))
    
    return {
        "perplexity_score": float(ppl_score),
        "burstiness_score": float(burst_score),
        "avg_perplexity": float(avg_perplexity),
        "sentence_perplexities": [float(p) for p in perplexities]
    }
