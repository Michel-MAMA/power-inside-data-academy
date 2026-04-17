"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { FAQItem } from "@/types";

interface FAQProps {
  items: FAQItem[];
}

export default function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="bg-graphite border border-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-slate transition-colors"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-white pr-4">{item.question}</span>
              <span className="flex-shrink-0 text-white-35">
                {isOpen ? <X size={16} /> : <Plus size={16} />}
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: isOpen ? "300px" : "0" }}
            >
              <p className="px-5 pb-5 text-sm text-white-60 leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
