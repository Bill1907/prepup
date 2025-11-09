import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Info } from "lucide-react";
import Link from "next/link";

export default async function UploadResumePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard/resume" className="text-blue-600 hover:underline text-sm">
            ← Back to Resumes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Upload Resume</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload your resume to get AI-powered feedback and suggestions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Your Resume</CardTitle>
            <CardDescription>
              Supported formats: PDF, DOCX, DOC (Max size: 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop your resume here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                PDF, DOCX, or DOC up to 5MB
              </p>
              <Button>Choose File</Button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">Tips for better results:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Use a clear, well-formatted resume</li>
                    <li>Include relevant keywords for your target role</li>
                    <li>Ensure all text is selectable (not images)</li>
                    <li>Include contact information and work experience</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-4">Or start from a template</h3>
              <div className="grid grid-cols-2 gap-4">
                {["Modern Professional", "Creative Designer", "Executive Leader", "Tech Specialist"].map((template) => (
                  <Card key={template} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <FileText className="h-8 w-8 text-blue-600 mb-2" />
                      <h4 className="font-medium mb-2">{template}</h4>
                      <Button variant="outline" size="sm" className="w-full">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

