import React from "react";
import type { QuizQuestion } from "../../core/types";

export interface QuestionBoxProps {
  question: QuizQuestion | null;
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number | null;
  removedIndices: number[];
  isFinalAnswer: boolean;
  isRevealed: boolean;
  onSelectChoice: (index: number) => void;
  disabled?: boolean;
}

const LETTERS = ["A", "B", "C", "D"];

export function QuestionBox({
  question,
  choices,
  selectedIndex,
  correctIndex,
  removedIndices,
  isFinalAnswer,
  isRevealed,
  onSelectChoice,
  disabled,
}: QuestionBoxProps) {
  if (!question) return null;

  return (
    <div className="w-full space-y-4 md:space-y-6">
      {/* Question Card */}
      <div className="relative bg-[#070e24]/90 border-2 border-amber-500/50 rounded-2xl p-6 md:p-8 shadow-2xl text-center">
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 px-4 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow">
          {question.category} • Niveau {question.difficulty}
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-100 leading-relaxed tracking-wide pt-2">
          {question.question}
        </h2>
      </div>

      {/* 4 Choices Grid (A, B, C, D) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {choices.map((choice, index) => {
          const isRemoved = removedIndices.includes(index);
          const isSelected = selectedIndex === index;
          const isCorrect = isRevealed && correctIndex === index;
          const isWrong = isRevealed && isSelected && correctIndex !== index;

          let cardStyle =
            "bg-[#0b1736]/90 border-2 border-amber-500/30 text-slate-100 hover:border-amber-400 hover:bg-[#12234e]";

          if (isRemoved) {
            cardStyle = "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-40";
          } else if (isCorrect) {
            cardStyle =
              "bg-gradient-to-r from-emerald-600 to-green-500 border-emerald-300 text-white font-black shadow-lg shadow-emerald-500/40 animate-pulse";
          } else if (isWrong) {
            cardStyle = "bg-gradient-to-r from-red-600 to-rose-700 border-red-400 text-white font-bold";
          } else if (isSelected) {
            if (isFinalAnswer) {
              cardStyle =
                "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black border-amber-200 animate-pulse-glow shadow-xl shadow-amber-500/40";
            } else {
              cardStyle =
                "bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-500/20";
            }
          }

          return (
            <button
              key={index}
              disabled={disabled || isRemoved || isFinalAnswer}
              onClick={() => onSelectChoice(index)}
              className={`p-4 md:p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 text-left group ${cardStyle}`}
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-lg font-mono font-black text-sm shrink-0 ${
                  isSelected && isFinalAnswer
                    ? "bg-slate-950 text-amber-400"
                    : isCorrect
                    ? "bg-white text-green-700"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/40 group-hover:bg-amber-500 group-hover:text-slate-950"
                }`}
              >
                {LETTERS[index]}
              </span>
              <span className="text-sm md:text-base font-semibold tracking-wide flex-1">
                {isRemoved ? "—" : choice}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
