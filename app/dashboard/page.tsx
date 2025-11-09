import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Mic, TrendingUp, Calendar, Clock, Award } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  // Mock data
  const stats = {
    resumeReviews: 5,
    questionsCompleted: 48,
    mockInterviews: 12,
    successRate: 87,
  };

  const recentActivity = [
    { id: 1, type: "resume", title: "Senior Developer Resume", date: "2 hours ago", status: "Reviewed" },
    { id: 2, type: "mock", title: "Technical Interview Practice", date: "1 day ago", status: "Completed" },
    { id: 3, type: "questions", title: "Behavioral Questions Set", date: "2 days ago", status: "Completed" },
    { id: 4, type: "resume", title: "Product Manager Resume", date: "3 days ago", status: "Reviewed" },
  ];

  const upcomingSessions = [
    { id: 1, title: "System Design Mock Interview", date: "Tomorrow, 2:00 PM", type: "Mock Interview" },
    { id: 2, title: "Leadership Questions Review", date: "Nov 12, 10:00 AM", type: "Practice Session" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back! Here's your interview preparation progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resume Reviews</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resumeReviews}</div>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Questions Completed</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.questionsCompleted}</div>
              <p className="text-xs text-muted-foreground">+12 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mock Interviews</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mockInterviews}</div>
              <p className="text-xs text-muted-foreground">+3 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-muted-foreground">+5% from last week</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Start your interview preparation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button className="h-24 flex-col gap-2" variant="outline" asChild>
                    <Link href="/dashboard/resume">
                      <FileText className="h-6 w-6" />
                      <span>Upload Resume</span>
                    </Link>
                  </Button>
                  <Button className="h-24 flex-col gap-2" variant="outline" asChild>
                    <Link href="/dashboard/questions">
                      <MessageSquare className="h-6 w-6" />
                      <span>Practice Questions</span>
                    </Link>
                  </Button>
                  <Button className="h-24 flex-col gap-2" variant="outline" asChild>
                    <Link href="/dashboard/mock-interview">
                      <Mic className="h-6 w-6" />
                      <span>Start Mock Interview</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest preparation sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex items-center gap-4">
                        {activity.type === "resume" && <FileText className="h-5 w-5 text-blue-600" />}
                        {activity.type === "mock" && <Mic className="h-5 w-5 text-green-600" />}
                        {activity.type === "questions" && <MessageSquare className="h-5 w-5 text-purple-600" />}
                        <div>
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.date}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{activity.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Study Goal</span>
                    <span className="font-medium">8/10 hours</span>
                  </div>
                  <Progress value={80} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Mock Interviews</span>
                    <span className="font-medium">3/5 completed</span>
                  </div>
                  <Progress value={60} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Questions Practice</span>
                    <span className="font-medium">48/50 questions</span>
                  </div>
                  <Progress value={96} />
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="border-l-2 border-blue-600 pl-4">
                    <p className="font-medium text-sm">{session.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {session.date}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {session.type}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link href="/dashboard/schedule">View All Sessions</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

