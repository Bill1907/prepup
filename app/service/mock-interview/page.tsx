import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mic, Play, Clock, Calendar, TrendingUp, Award, BarChart } from "lucide-react";

export default async function MockInterviewPage() {
  // Mock data
  const stats = {
    totalInterviews: 12,
    avgScore: 87,
    totalMinutes: 245,
    improvement: 15,
  };

  const interviewHistory = [
    {
      id: 1,
      title: "Senior Software Engineer - Technical",
      date: "Nov 8, 2025",
      duration: "35 min",
      score: 92,
      feedback: "Excellent technical depth. Great communication skills.",
      status: "Completed",
    },
    {
      id: 2,
      title: "Product Manager - Behavioral",
      date: "Nov 6, 2025",
      duration: "28 min",
      score: 85,
      feedback: "Strong leadership examples. Work on quantifying impact.",
      status: "Completed",
    },
    {
      id: 3,
      title: "System Design Interview",
      date: "Nov 4, 2025",
      duration: "45 min",
      score: 88,
      feedback: "Good scalability thinking. Consider more edge cases.",
      status: "Completed",
    },
  ];

  const upcomingInterviews = [
    {
      id: 1,
      title: "Full Stack Developer - Coding",
      scheduledDate: "Nov 10, 2025",
      time: "2:00 PM",
    },
    {
      id: 2,
      title: "Leadership & Management",
      scheduledDate: "Nov 12, 2025",
      time: "10:00 AM",
    },
  ];

  const interviewTypes = [
    {
      name: "Technical Interview",
      description: "Coding problems and technical discussions",
      duration: "45-60 min",
      difficulty: "Medium-Hard",
      icon: "💻",
    },
    {
      name: "Behavioral Interview",
      description: "Past experiences and soft skills",
      duration: "30-45 min",
      difficulty: "Medium",
      icon: "💼",
    },
    {
      name: "System Design",
      description: "Architecture and scalability questions",
      duration: "45-60 min",
      difficulty: "Hard",
      icon: "🏗️",
    },
    {
      name: "Leadership Interview",
      description: "Management and team leadership",
      duration: "30-45 min",
      difficulty: "Medium",
      icon: "👥",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mock Interviews</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Practice with AI-powered mock interviews and get real-time feedback
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Total Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInterviews}</div>
              <p className="text-xs text-green-600 mt-1">+3 this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}%</div>
              <p className="text-xs text-green-600 mt-1">+{stats.improvement}% improvement</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Practice Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMinutes} min</div>
              <p className="text-xs text-gray-600 mt-1">Total practice</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-gray-600 mt-1">Interview success</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Start New Interview */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-white">Ready for Your Next Interview?</CardTitle>
                <CardDescription className="text-blue-100">
                  Start a new AI-powered mock interview session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/service/mock-interview/new">
                    <Play className="mr-2 h-5 w-5" />
                    Start New Interview
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Interview Types */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Types</CardTitle>
                <CardDescription>Choose the type of interview you want to practice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {interviewTypes.map((type) => (
                    <Card key={type.name} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="text-3xl mb-3">{type.icon}</div>
                        <h3 className="font-semibold mb-2">{type.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {type.description}
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">{type.duration}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Difficulty:</span>
                            <Badge variant="secondary" className="text-xs">
                              {type.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link href={`/service/mock-interview/new?type=${type.name.toLowerCase().replace(/\s+/g, '-')}`}>
                            Start {type.name}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Interview History */}
            <Card>
              <CardHeader>
                <CardTitle>Interview History</CardTitle>
                <CardDescription>Review your past mock interview sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interviewHistory.map((interview) => (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold mb-1">{interview.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {interview.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {interview.duration}
                              </span>
                            </div>
                          </div>
                          <Badge variant="default">{interview.status}</Badge>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Performance Score</span>
                            <span className="text-sm font-bold">{interview.score}/100</span>
                          </div>
                          <Progress value={interview.score} />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Feedback:</strong> {interview.feedback}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/service/mock-interview/${interview.id}`}>
                              View Details
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/service/mock-interview/${interview.id}/recording`}>
                              <Play className="mr-2 h-3 w-3" />
                              Watch Recording
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="border-l-2 border-blue-600 pl-4">
                    <p className="font-medium text-sm mb-1">{interview.title}</p>
                    <p className="text-xs text-gray-600 mb-2">
                      {interview.scheduledDate} at {interview.time}
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Join Session
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link href="/service/mock-interview/schedule">
                    Schedule New Session
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Communication</span>
                    <span className="font-medium">90%</span>
                  </div>
                  <Progress value={90} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Technical Knowledge</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <Progress value={85} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Problem Solving</span>
                    <span className="font-medium">88%</span>
                  </div>
                  <Progress value={88} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Confidence</span>
                    <span className="font-medium">82%</span>
                  </div>
                  <Progress value={82} />
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="font-medium">1.</div>
                  <p>Find a quiet space with good lighting</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="font-medium">2.</div>
                  <p>Test your microphone before starting</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="font-medium">3.</div>
                  <p>Speak clearly and maintain eye contact</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="font-medium">4.</div>
                  <p>Take your time to think before answering</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

