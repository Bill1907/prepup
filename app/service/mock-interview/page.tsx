import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  Play,
  Clock,
  TrendingUp,
  Award,
  BarChart,
  BookOpen,
  Target,
  Bookmark,
  ArrowRight
} from "lucide-react";

export default async function MockInterviewPage() {
  // TODO: Replace with real data from GraphQL
  const stats = {
    totalPracticed: 24,
    avgScore: 82,
    totalMinutes: 156,
    bookmarkedCount: 8,
  };

  // TODO: Replace with real practice history from interview_answers table
  const recentPractice = [
    {
      id: "q1",
      questionText: "Tell me about a time when you had to deal with a difficult team member.",
      category: "behavioral",
      practicedAt: "2 hours ago",
      score: 85,
      attempts: 3,
    },
    {
      id: "q2",
      questionText: "How would you design a URL shortening service like bit.ly?",
      category: "system_design",
      practicedAt: "Yesterday",
      score: 78,
      attempts: 2,
    },
    {
      id: "q3",
      questionText: "What is the difference between REST and GraphQL?",
      category: "technical",
      practicedAt: "2 days ago",
      score: 92,
      attempts: 1,
    },
  ];

  const categoryStats = [
    { name: "Behavioral", icon: "💼", count: 12, practiced: 8, color: "bg-blue-500" },
    { name: "Technical", icon: "💻", count: 15, practiced: 6, color: "bg-purple-500" },
    { name: "System Design", icon: "🏗️", count: 8, practiced: 4, color: "bg-orange-500" },
    { name: "Leadership", icon: "👥", count: 6, practiced: 3, color: "bg-green-500" },
    { name: "Problem Solving", icon: "🧩", count: 10, practiced: 2, color: "bg-yellow-500" },
    { name: "Company Specific", icon: "🎯", count: 5, practiced: 1, color: "bg-pink-500" },
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      behavioral: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      technical: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      system_design: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      leadership: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      problem_solving: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      company_specific: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      behavioral: "Behavioral",
      technical: "Technical",
      system_design: "System Design",
      leadership: "Leadership",
      problem_solving: "Problem Solving",
      company_specific: "Company Specific",
    };
    return labels[category] || category;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Question Practice</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Practice individual interview questions and get AI-powered feedback
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Questions Practiced
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPracticed}</div>
              <p className="text-xs text-green-600 mt-1">+5 this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}%</div>
              <p className="text-xs text-green-600 mt-1">+8% improvement</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Practice Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMinutes} min</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total practice</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Bookmarked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bookmarkedCount}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Questions saved</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Start Practice CTA */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-white">Ready to Practice?</CardTitle>
                <CardDescription className="text-blue-100">
                  Pick a question and start practicing with AI feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/service/questions">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Browse Questions
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20 text-white" asChild>
                  <Link href="/service/questions?filter=bookmarked">
                    <Bookmark className="mr-2 h-5 w-5" />
                    Bookmarked
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Category Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle>Practice by Category</CardTitle>
                <CardDescription>Jump into questions by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {categoryStats.map((cat) => (
                    <Link
                      key={cat.name}
                      href={`/service/questions?category=${cat.name.toLowerCase().replace(/\s+/g, '_')}`}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{cat.icon}</span>
                              <div>
                                <h3 className="font-medium text-sm">{cat.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {cat.practiced}/{cat.count} practiced
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16">
                                <Progress value={(cat.practiced / cat.count) * 100} className="h-2" />
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Practice */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Practice</CardTitle>
                <CardDescription>Continue where you left off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPractice.map((practice) => (
                    <Card key={practice.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm mb-2 line-clamp-2">
                              {practice.questionText}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={getCategoryColor(practice.category)}>
                                {getCategoryLabel(practice.category)}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {practice.practicedAt}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                • {practice.attempts} {practice.attempts === 1 ? 'attempt' : 'attempts'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-lg font-bold">{practice.score}</div>
                              <div className="text-xs text-gray-500">score</div>
                            </div>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/service/questions/${practice.id}/practice`}>
                                <Play className="h-3 w-3 mr-1" />
                                Retry
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {recentPractice.length > 0 && (
                  <Button variant="ghost" className="w-full mt-4" asChild>
                    <Link href="/service/questions?sort=recent">
                      View All Practice History
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Performance by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Behavioral</span>
                    <span className="font-medium">88%</span>
                  </div>
                  <Progress value={88} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Technical</span>
                    <span className="font-medium">76%</span>
                  </div>
                  <Progress value={76} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>System Design</span>
                    <span className="font-medium">82%</span>
                  </div>
                  <Progress value={82} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Leadership</span>
                    <span className="font-medium">90%</span>
                  </div>
                  <Progress value={90} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Problem Solving</span>
                    <span className="font-medium">72%</span>
                  </div>
                  <Progress value={72} />
                </div>
              </CardContent>
            </Card>

            {/* Practice Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Practice Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Mic className="h-4 w-4 mt-0.5 text-blue-500" />
                  <p>Practice answering out loud for better retention</p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-blue-500" />
                  <p>Aim for 2-3 minute responses for behavioral questions</p>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 mt-0.5 text-blue-500" />
                  <p>Use the STAR method: Situation, Task, Action, Result</p>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 mt-0.5 text-blue-500" />
                  <p>Review suggested answers after each practice</p>
                </div>
              </CardContent>
            </Card>

            {/* Generate More Questions */}
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="font-semibold mb-2">Need More Questions?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Generate new questions from your resume
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/service/questions">
                    Generate Questions
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
