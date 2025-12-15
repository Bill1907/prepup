"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { QuestionCategory } from "@/lib/graphql/queries/questions";

interface CategoryStats {
  behavioral: number;
  technical: number;
  system_design: number;
  leadership: number;
  problem_solving: number;
  company_specific: number;
}

interface CategoryGridProps {
  stats: CategoryStats;
  onCategoryClick?: (category: QuestionCategory) => void;
}

const categories: {
  key: QuestionCategory;
  name: string;
  icon: string;
}[] = [
  { key: "behavioral", name: "Behavioral", icon: "💼" },
  { key: "technical", name: "Technical", icon: "💻" },
  { key: "system_design", name: "System Design", icon: "🏗️" },
  { key: "leadership", name: "Leadership", icon: "👥" },
  { key: "problem_solving", name: "Problem Solving", icon: "🧩" },
  { key: "company_specific", name: "Company Specific", icon: "🏢" },
];

export function CategoryGrid({ stats, onCategoryClick }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {categories.map((category) => (
        <Card
          key={category.key}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onCategoryClick?.(category.key)}
        >
          <CardContent className="pt-6 text-center">
            <div className="text-3xl mb-2">{category.icon}</div>
            <h3 className="font-semibold mb-1">{category.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats[category.key]} questions
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

