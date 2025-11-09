import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Edit, Download, Clock, Star, Plus, MoreVertical } from "lucide-react";

export default async function ResumePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  // Mock data
  const resumes = [
    {
      id: 1,
      name: "Senior Software Engineer Resume",
      status: "Reviewed",
      score: 92,
      lastUpdated: "2 hours ago",
      version: 3,
      feedback: "Excellent technical skills section. Consider adding more quantifiable achievements.",
    },
    {
      id: 2,
      name: "Product Manager Resume",
      status: "In Review",
      score: 85,
      lastUpdated: "1 day ago",
      version: 2,
      feedback: "Strong leadership examples. Add more metrics to demonstrate impact.",
    },
    {
      id: 3,
      name: "Full Stack Developer Resume",
      status: "Draft",
      score: 78,
      lastUpdated: "3 days ago",
      version: 1,
      feedback: "Good foundation. Improve keywords for ATS optimization.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resume Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Upload, edit, and optimize your resumes with AI-powered feedback
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/resume/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Resume
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Resumes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Avg. Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Reviews Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Templates Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
            </CardContent>
          </Card>
        </div>

        {/* Resumes List */}
        <div className="grid gap-6">
          {resumes.map((resume) => (
            <Card key={resume.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{resume.name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Updated {resume.lastUpdated}
                        </span>
                        <span>Version {resume.version}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={resume.status === "Reviewed" ? "default" : resume.status === "In Review" ? "secondary" : "outline"}
                    >
                      {resume.status}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">ATS Score</span>
                      <span className="text-sm font-bold">{resume.score}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          resume.score >= 90 ? "bg-green-500" : 
                          resume.score >= 80 ? "bg-blue-500" : 
                          "bg-yellow-500"
                        }`}
                        style={{ width: `${resume.score}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="font-medium">{(resume.score / 20).toFixed(1)}</span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>AI Feedback:</strong> {resume.feedback}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="default" asChild>
                    <Link href={`/dashboard/resume/${resume.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Resume
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/resume/${resume.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/resume/${resume.id}/download`}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/resume/${resume.id}/history`}>
                      <Clock className="mr-2 h-4 w-4" />
                      History
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Templates Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Resume Templates</CardTitle>
            <CardDescription>Start with a professional template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {["Modern", "Classic", "Creative", "Executive"].map((template) => (
                <Card key={template} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                      <FileText className="h-12 w-12 text-gray-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold mb-2">{template}</h3>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/dashboard/resume/template/${template.toLowerCase()}`}>
                        Use Template
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

