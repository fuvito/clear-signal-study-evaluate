
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_MODEL = import.meta.env.VITE_GEMINI_MODEL;

const getModel = () => {
    if (!API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY is missing in environment variables.");
    }
    if (!API_MODEL) {
        throw new Error("VITE_GEMINI_MODEL is missing in environment variables.");
    }
    const genAI = new GoogleGenerativeAI(API_KEY);
    return genAI.getGenerativeModel({ model: API_MODEL });
};

export interface RubricDimensions {
    conceptualKnowledge: number;
    accuracy: number;
    depthAndReasoning: number;
    practicalApplication: number;
    edgeCases: number;
    clarity: number;
}

export interface EvaluationResult {
    score: number; // 0-100
    grade: string;
    dimensions: RubricDimensions;
    feedback: string; // General summary
    strengths: string[];
    improvements: string[];
}

// Full rubric text from docs
const FULL_RUBRIC = `
# Rubric Dimensions (0-5 Scale per dimension)

1. **Conceptual Knowledge (Weight: 25%)**
   - 0: Missing/Incorrect.
   - 3: Correct explanation.
   - 5: Deep understanding, relationships between concepts.

2. **Accuracy & Correctness (Weight: 25%)**
   - 0: Major errors.
   - 3: Minor inaccuracies.
   - 5: Fully correct, standards-aligned.

3. **Depth & Reasoning (Weight: 15%)**
   - 0: Pure definitions.
   - 3: Basic reasoning.
   - 5: Explains "why", tradeoffs, implications.

4. **Practical Application (Weight: 20%)**
   - 0: Theoretical only.
   - 3: Basic use cases.
   - 5: Real-world examples (React, APIs, libs).

5. **Edge Cases & Pitfalls (Weight: 10%)**
   - 0: None mentioned.
   - 3: Mentions common pitfalls.
   - 5: Explains how to avoid them.

6. **Clarity & Precision (Weight: 5%)**
   - 0: Confusing.
   - 3: Understandable.
   - 5: Precise, professional.

# Final Score Formula (0-100)
((Conceptual * 0.25) + (Accuracy * 0.25) + (Reasoning * 0.15) + (Practical * 0.20) + (EdgeCases * 0.10) + (Clarity * 0.05)) * 20
`;

export const evaluateAnswer = async (
    question: string,
    userAnswer: string,
    correctAnswer: string
): Promise<EvaluationResult> => {
    try {
        const model = getModel();

        const prompt = `
        You are an expert technical interviewer. Evaluate the following candidate answer based on the detailed rubric provided.
        
        **Question:** ${question}
        **Reference Answer:** ${correctAnswer}
        **Candidate Answer:** ${userAnswer}

        **Rubric:**
        ${FULL_RUBRIC}

        **Instructions:**
        1. Score each dimension on a scale of 0 to 5 based on the anchors.
        2. Calculate the final weighted score (0-100).
        3. Assign a letter Grade (A, B, C, D, F).
        4. Provide constructive feedback.
        
        Return the response in valid JSON format ONLY, matching this structure:
        {
            "score": number,
            "grade": "string",
            "dimensions": {
                "conceptualKnowledge": number,
                "accuracy": number,
                "depthAndReasoning": number,
                "practicalApplication": number,
                "edgeCases": number,
                "clarity": number
            },
            "feedback": "string",
            "strengths": ["string", "string"],
            "improvements": ["string", "string"]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString) as EvaluationResult;
    } catch (error) {
        console.error("AI Evaluation Failed:", error);
        return {
            score: 0,
            grade: "N/A",
            dimensions: {
                conceptualKnowledge: 0,
                accuracy: 0,
                depthAndReasoning: 0,
                practicalApplication: 0,
                edgeCases: 0,
                clarity: 0
            },
            feedback: "AI Evaluation failed. Please check your API key.",
            strengths: [],
            improvements: ["System error."]
        };
    }
};
