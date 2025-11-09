import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FileText, MessageSquare, Mic, ArrowRight, CheckCircle2 } from "lucide-react";

export default function DemoPage() {
  const features = [
    {
      icon: <FileText className="h-12 w-12 text-blue-600" />,
      title: "Resume Review Demo",
      description: "See how our AI analyzes and provides feedback on resumes",
      highlights: [
        "ATS compatibility check",
        "Content improvement suggestions",
        "Formatting recommendations",
        "Keyword optimization",
      ],
      demoPath: "/demo/resume",
    },
    {
      icon: <MessageSquare className="h-12 w-12 text-purple-600" />,
      title: "Interview Questions Demo",
      description: "Explore sample interview questions and answer frameworks",
      highlights: [
        "Behavioral questions",
        "Technical questions",
        "STAR method examples",
        "Answer tips & resources",
      ],
      demoPath: "/demo/questions",
    },
    {
      icon: <Mic className="h-12 w-12 text-green-600" />,
      title: "Mock Interview Demo",
      description: "Experience a sample mock interview session",
      highlights: [
        "AI interviewer simulation",
        "Real-time feedback",
        "Performance evaluation",
        "Recording playback",
      ],
      demoPath: "/demo/mock-interview",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-transparent dark:from-gray-800 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            🎯 Interactive Demo
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Try PrepUp Without Signing Up
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Explore our features with interactive demos and see how PrepUp can help you ace your interviews
          </p>
        </div>
      </section>

      {/* Demo Features */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" asChild>
                    <Link href={feature.demoPath}>
                      Try Demo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Demo Limitations Note */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                📌 Demo Limitations
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Demo features use sample data and limited functionality</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Your data will not be saved in demo mode</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Full features and personalization available with a free account</span>
                </li>
              </ul>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/auth/sign-up">Create Free Account</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/auth/sign-in">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* What You Get With a Free Account */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              What You Get With a Free Account
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                "1 Resume Review",
                "20 Interview Questions",
                "1 Mock Interview/Month",
                "Progress Tracking",
                "Basic Templates",
                "Answer Frameworks",
                "Study Resources",
                "Community Access",
              ].map((benefit, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Create your free account now and unlock the full power of PrepUp
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/sign-up">Create Free Account</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-white text-white hover:bg-white/10" 
              asChild
            >
              <Link href="/#pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

