"""
Stylometric feature extraction + inference for the text-detection ensemble.

Uses 14 hand-crafted, interpretable features that research shows separate human
from LLM-written text. AI text often has very uniform paragraph lengths, 
fewer contractions, fewer sentences starting with conjunctions ("And", "But"),
and higher vocabulary repetition (lower hapax legomena).
"""

import os
import re
import string
import numpy as np

FUNCTION_WORDS = {
    "the", "a", "an", "and", "or", "but", "if", "then", "because", "as", "until", "while",
    "of", "at", "by", "for", "with", "about", "against", "between", "into", "through",
    "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out",
    "on", "off", "over", "under", "again", "further", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "shall",
    "should", "can", "could", "may", "might", "must", "this", "that", "these", "those",
    "i", "you", "he", "she", "it", "we", "they", "them", "his", "her", "its", "our", "their",
}

CONTRACTIONS = {
    "n't", "'re", "'s", "'m", "'ll", "'ve", "'d", "cannot"
}

CONJUNCTIONS = {"and", "but", "so", "or", "because", "yet"}

FEATURE_ORDER = [
    "avg_sentence_length",
    "sentence_length_std",
    "type_token_ratio",
    "avg_word_length",
    "function_word_ratio",
    "punctuation_diversity",
    # NEW FEATURES BELOW:
    "hapax_legomena_ratio",
    "avg_paragraph_length",
    "paragraph_length_std",
    "contraction_ratio",
    "question_ratio",
    "exclamation_ratio",
    "conjunction_start_ratio",
]


def _split_paragraphs(text: str):
    return [p.strip() for p in re.split(r'\n\s*\n', text.strip()) if p.strip()]

def _split_sentences(text: str):
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s for s in sentences if s.strip()]

def _split_words(text: str):
    return re.findall(r"[A-Za-z']+", text.lower())


def extract_features(text: str) -> dict:
    sentences = _split_sentences(text)
    words = _split_words(text)
    paragraphs = _split_paragraphs(text)

    if not words or not sentences:
        return {k: 0.0 for k in FEATURE_ORDER}

    # Sentence stats
    sentence_lengths = [len(_split_words(s)) for s in sentences]
    avg_sentence_length = float(np.mean(sentence_lengths))
    sentence_length_std = float(np.std(sentence_lengths))

    # Vocabulary stats
    word_counts = {}
    for w in words:
        word_counts[w] = word_counts.get(w, 0) + 1
        
    unique_words = len(word_counts)
    type_token_ratio = unique_words / len(words)
    
    hapax_legomena = sum(1 for w, c in word_counts.items() if c == 1)
    hapax_legomena_ratio = hapax_legomena / len(words)

    avg_word_length = float(np.mean([len(w) for w in words]))

    # Specific word classes
    function_word_count = sum(1 for w in words if w in FUNCTION_WORDS)
    function_word_ratio = function_word_count / len(words)
    
    contraction_count = sum(1 for w in words if any(c in w for c in CONTRACTIONS))
    contraction_ratio = contraction_count / len(words)

    # Paragraph stats
    if not paragraphs:
        paragraphs = [text]
    paragraph_lengths = [len(_split_words(p)) for p in paragraphs]
    avg_paragraph_length = float(np.mean(paragraph_lengths))
    paragraph_length_std = float(np.std(paragraph_lengths))

    # Sentence starts/ends
    question_count = sum(1 for s in sentences if s.endswith('?'))
    question_ratio = question_count / len(sentences)
    
    exclamation_count = sum(1 for s in sentences if s.endswith('!'))
    exclamation_ratio = exclamation_count / len(sentences)
    
    conj_start_count = 0
    for s in sentences:
        s_words = _split_words(s)
        if s_words and s_words[0] in CONJUNCTIONS:
            conj_start_count += 1
    conjunction_start_ratio = conj_start_count / len(sentences)

    # Punctuation
    punctuation_used = set(ch for ch in text if ch in string.punctuation)
    total_punctuation = sum(1 for ch in text if ch in string.punctuation)
    punctuation_diversity = (len(punctuation_used) / total_punctuation) if total_punctuation else 0.0

    return {
        "avg_sentence_length": avg_sentence_length,
        "sentence_length_std": sentence_length_std,
        "type_token_ratio": type_token_ratio,
        "avg_word_length": avg_word_length,
        "function_word_ratio": function_word_ratio,
        "punctuation_diversity": punctuation_diversity,
        "hapax_legomena_ratio": hapax_legomena_ratio,
        "avg_paragraph_length": avg_paragraph_length,
        "paragraph_length_std": paragraph_length_std,
        "contraction_ratio": contraction_ratio,
        "question_ratio": question_ratio,
        "exclamation_ratio": exclamation_ratio,
        "conjunction_start_ratio": conjunction_start_ratio,
    }


def features_to_vector(features: dict):
    return [features[k] for k in FEATURE_ORDER]


_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "stylometric_classifier.joblib"
)
_cached_pipeline = None


def predict_stylometric(text: str) -> dict:
    """
    Returns {"ai_probability": float, "features": dict}.
    Raises FileNotFoundError if the classifier hasn't been trained yet.
    """
    global _cached_pipeline
    if _cached_pipeline is None:
        if not os.path.exists(_MODEL_PATH):
            raise FileNotFoundError(
                f"Stylometric classifier not found at {_MODEL_PATH}. "
                f"Run: python ml/text_detector/train_stylometric_classifier.py"
            )
        import joblib
        _cached_pipeline = joblib.load(_MODEL_PATH)

    features = extract_features(text)
    vector = [features_to_vector(features)]
    
    ai_probability = float(_cached_pipeline.predict_proba(vector)[0][1])

    return {"ai_probability": ai_probability, "features": features}
