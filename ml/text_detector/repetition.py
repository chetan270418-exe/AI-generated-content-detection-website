"""
Repetition & N-gram Analysis — fast, model-free statistical signal.

AI-generated text exhibits measurable repetition patterns:
1. Higher trigram repetition rate (reuses exact 3-word phrases)
2. Lower sentence-starter diversity (AI cycles through the same openers)
3. Overuse of specific "AI cliché" phrases that LLMs favor

All purely statistical — no ML model needed, runs in <10ms.
"""

import re
from collections import Counter
from typing import List


# Curated list of phrases that LLMs (GPT-4, Claude, Gemini) disproportionately
# favor over human writers. Sourced from linguistic analysis studies and
# community-maintained lists.
AI_CLICHE_PHRASES = [
    # Transitional/hedging phrases
    "it's worth noting", "it is worth noting",
    "it's important to note", "it is important to note",
    "it's crucial to", "it is crucial to",
    "in today's world", "in today's digital age",
    "in today's fast-paced", "in today's rapidly",
    "in the realm of", "in the world of",
    "when it comes to",
    "at the end of the day",
    "on the other hand",
    "having said that",
    "that being said",
    "it goes without saying",
    "needless to say",
    "as a matter of fact",
    # AI-favored adjectives/adverbs
    "delve", "delving", "delved",
    "tapestry", "intricate tapestry",
    "multifaceted",
    "nuanced",
    "landscape",
    "paradigm",
    "synergy",
    "holistic",
    "leverage", "leveraging",
    "navigate", "navigating",
    "foster", "fostering",
    "underscore", "underscores",
    "pivotal",
    "robust",
    "comprehensive",
    "meticulous", "meticulously",
    "commendable",
    "testament to",
    "plethora",
    "myriad",
    "embark", "embarking",
    # Structural clichés
    "in conclusion",
    "to summarize",
    "in summary",
    "furthermore",
    "moreover",
    "additionally",
    "consequently",
    "nevertheless",
    "subsequently",
]


def _split_sentences(text: str) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 3]


def _get_words(text: str) -> List[str]:
    return re.findall(r"[A-Za-z']+", text.lower())


def _get_trigrams(words: List[str]) -> List[str]:
    return [" ".join(words[i:i+3]) for i in range(len(words) - 2)]


def compute_repetition_scores(text: str) -> dict:
    """
    Analyze text for repetition patterns characteristic of AI generation.

    Returns:
        {
            "repetition_score": float 0-1 (higher = more likely AI),
            "trigram_repetition_rate": float,
            "sentence_starter_diversity": float,
            "cliche_density": float,
            "cliches_found": list[str],
        }
    """
    words = _get_words(text)
    sentences = _split_sentences(text)

    if len(words) < 10 or len(sentences) < 2:
        return {
            "repetition_score": 0.5,
            "trigram_repetition_rate": 0.0,
            "sentence_starter_diversity": 1.0,
            "cliche_density": 0.0,
            "cliches_found": [],
        }

    # --- 1. Trigram repetition rate ---
    trigrams = _get_trigrams(words)
    if trigrams:
        trigram_counts = Counter(trigrams)
        repeated = sum(1 for count in trigram_counts.values() if count > 1)
        trigram_repetition_rate = repeated / len(trigram_counts)
    else:
        trigram_repetition_rate = 0.0

    # --- 2. Sentence starter diversity ---
    # Extract first 3 words of each sentence
    starters = []
    for s in sentences:
        s_words = _get_words(s)
        if len(s_words) >= 3:
            starters.append(" ".join(s_words[:3]))
        elif s_words:
            starters.append(" ".join(s_words))

    if starters:
        unique_starters = len(set(starters))
        sentence_starter_diversity = unique_starters / len(starters)
    else:
        sentence_starter_diversity = 1.0

    # --- 3. Cliché density ---
    text_lower = text.lower()
    cliches_found = []
    for phrase in AI_CLICHE_PHRASES:
        if phrase in text_lower:
            cliches_found.append(phrase)

    # Normalize by text length (per 100 words)
    cliche_density = (len(cliches_found) / max(1, len(words))) * 100

    # --- Scoring ---
    # Trigram repetition: AI typically 0.05-0.15, human 0.01-0.05
    import math
    tri_score = 1.0 / (1.0 + math.exp(-30.0 * (trigram_repetition_rate - 0.06)))

    # Starter diversity: AI typically 0.5-0.7, human 0.7-1.0
    # Lower diversity → higher AI score
    starter_score = 1.0 / (1.0 + math.exp(8.0 * (sentence_starter_diversity - 0.65)))

    # Cliché density: AI typically 0.5-3.0 per 100 words, human 0-0.5
    cliche_score = 1.0 / (1.0 + math.exp(-3.0 * (cliche_density - 0.5)))

    repetition_score = 0.30 * tri_score + 0.30 * starter_score + 0.40 * cliche_score

    return {
        "repetition_score": float(max(0.0, min(1.0, repetition_score))),
        "trigram_repetition_rate": float(trigram_repetition_rate),
        "sentence_starter_diversity": float(sentence_starter_diversity),
        "cliche_density": float(cliche_density),
        "cliches_found": cliches_found,
    }
