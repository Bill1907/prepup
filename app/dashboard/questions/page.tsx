import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Search, Bookmark, TrendingUp, Zap, BookOpen, Star } from "lucide-react";

export default async function QuestionsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  // Mock data
  const categories = [
    { name: "Behavioral", count: 45, icon: "💼" },
    { name: "Technical", count: 78, icon: "💻" },
    { name: "System Design", count: 32, icon: "🏗️" },
    { name: "Leadership", count: 28, icon: "👥" },
    { name: "Problem Solving", count: 56, icon: "🧩" },
    { name: "Company Specific", count: 34, icon: "🏢" },
  ];

  const questions = [
    {
      id: 1,
      question: "Tell me about a time when you had to deal with a difficult stakeholder",
      category: "Behavioral",
      difficulty: "Medium",
      bookmarked: true,
      practiced: true,
      tips: "Use STAR method: Situation, Task, Action, Result",
    },
    {
      id: 2,
      question: "How would you design a URL shortening service like bit.ly?",
      category: "System Design",
      difficulty: "Hard",
      bookmarked: false,
      practiced: false,
      tips: "Focus on scalability, database design, and caching strategies",
    },
    {
      id: 3,
      question: "Describe your experience with Agile methodologies",
      category: "Leadership",
      difficulty: "Easy",
      bookmarked: true,
      practiced: true,
      tips: "Mention specific ceremonies, tools, and team outcomes",
    },
    {
      id: 4,
      question: "Implement a function to reverse a linked list",
      category: "Technical",
      difficulty: "Medium",
      bookmarked: false,
      practiced: false,
      tips: "Consider both iterative and recursive approaches",
    },
    {
      id: 5,
      question: "How do you handle conflicts within your team?",
      category: "Behavioral",
      difficulty: "Medium",
      bookmarked: false,
      practiced: true,
      tips: "Show emotional intelligence and conflict resolution skills",
    },
  ];

  const recentlyPracticed = questions.filter(q => q.practiced).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interview Questions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Practice with personalized questions based on your resume and target role
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Total Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">273</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Practiced
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Bookmarked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Search and Filter */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search questions..." 
                      className="pl-10"
                    />
                  </div>
                  <Button>Generate Questions</Button>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Question Categories</CardTitle>
                <CardDescription>Browse questions by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Card key={category.name} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6 text-center">
                        <div className="text-3xl mb-2">{category.icon}</div>
                        <h3 className="font-semibold mb-1">{category.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {category.count} questions
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Questions List */}
            <Card>
              <CardHeader>
                <CardTitle>All Questions</CardTitle>
                <CardDescription>Practice and bookmark your favorite questions</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
                    <TabsTrigger value="practiced">Practiced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    {questions.map((question) => (
                      <Card key={question.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-2">{question.question}</h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary">{question.category}</Badge>
                                <Badge 
                                  variant={
                                    question.difficulty === "Easy" ? "default" : 
                                    question.difficulty === "Medium" ? "secondary" : 
                                    "destructive"
                                  }
                                >
                                  {question.difficulty}
                                </Badge>
                                {question.practiced && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    ✓ Practiced
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className={question.bookmarked ? "text-yellow-500" : ""}
                            >
                              <Bookmark className={`h-5 w-5 ${question.bookmarked ? "fill-current" : ""}`} />
                            </Button>
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>💡 Tip:</strong> {question.tips}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" asChild>
                              <Link href={`/dashboard/questions/${question.id}/practice`}>
                                Practice
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/dashboard/questions/${question.id}`}>
                                View Answer Framework
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="bookmarked">
                    <p className="text-center text-gray-500 py-8">
                      Bookmarked questions will appear here
                    </p>
                  </TabsContent>

                  <TabsContent value="practiced">
                    <p className="text-center text-gray-500 py-8">
                      Your practiced questions will appear here
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recently Practiced */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Recently Practiced
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentlyPracticed.map((question) => (
                  <div key={question.id} className="border-l-2 border-green-500 pl-3">
                    <p className="text-sm font-medium mb-1 line-clamp-2">
                      {question.question}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {question.category}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Study Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="font-medium">1.</div>
                  <p>Practice answering out loud to build confidence</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="font-medium">2.</div>
                  <p>Use the STAR method for behavioral questions</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="font-medium">3.</div>
                  <p>Record yourself to identify areas for improvement</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="font-medium">4.</div>
                  <p>Review and update your answers regularly</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/questions/generate">
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Resume-Based Questions
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/mock-interview">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Start Mock Interview
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

