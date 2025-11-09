import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Video, MessageCircle, FileText } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const categories = [
    {
      title: "Getting Started",
      icon: <BookOpen className="h-6 w-6 text-blue-600" />,
      articles: 12,
    },
    {
      title: "Resume Management",
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      articles: 8,
    },
    {
      title: "Mock Interviews",
      icon: <Video className="h-6 w-6 text-green-600" />,
      articles: 15,
    },
    {
      title: "Billing & Subscription",
      icon: <MessageCircle className="h-6 w-6 text-orange-600" />,
      articles: 10,
    },
  ];

  const faqs = [
    {
      question: "How do I get started with PrepUp?",
      answer: "Getting started is easy! Simply sign up for a free account, complete your profile, and upload your resume. Our AI will analyze it and provide personalized feedback. You can then start practicing with interview questions or schedule a mock interview.",
    },
    {
      question: "How does the AI resume review work?",
      answer: "Our AI analyzes your resume for ATS optimization, content quality, formatting, and keyword usage. It compares your resume against industry standards and job requirements, then provides specific, actionable suggestions for improvement.",
    },
    {
      question: "Can I practice for specific companies or roles?",
      answer: "Yes! You can customize your practice sessions based on your target company, role, and industry. Our AI generates personalized questions based on your resume and the specific position you're applying for.",
    },
    {
      question: "How realistic are the mock interviews?",
      answer: "Our mock interviews use advanced AI to simulate real interview scenarios. The AI interviewer asks relevant questions, provides natural conversation flow, and evaluates your responses based on multiple criteria including content, communication, and confidence.",
    },
    {
      question: "What's included in the free plan?",
      answer: "The free plan includes 1 resume review, 20 interview questions, 1 mock interview per month, and access to basic templates. It's perfect for getting started and trying out the platform.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period, and you won't be charged again.",
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 14-day money-back guarantee for new subscribers. If you're not satisfied within the first 14 days, contact our support team for a full refund.",
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We take data security seriously. All your information is encrypted in transit and at rest. We never share your personal data or resumes with third parties without your explicit consent.",
    },
    {
      question: "Can I download my interview recordings?",
      answer: "Yes, all mock interview sessions are recorded and can be downloaded from your interview history. This allows you to review your performance and track your progress over time.",
    },
    {
      question: "How do I get support if I have issues?",
      answer: "You can reach our support team via email at support@prepup.com, through live chat (available Mon-Fri, 9am-5pm PST), or by visiting our Help Center for instant answers to common questions.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-transparent dark:from-gray-800 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            How Can We Help?
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Search our knowledge base or browse categories below
          </p>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search for help articles..." 
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-4">{category.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{category.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.articles} articles
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Popular Articles */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Popular Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "How to optimize your resume for ATS systems",
                "Setting up your first mock interview",
                "Understanding your AI feedback scores",
                "Best practices for video interviews",
                "Managing your subscription and billing",
                "Exporting your interview recordings",
              ].map((article, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base">{article}</CardTitle>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <Card>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Contact Support */}
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle>Still Need Help?</CardTitle>
                <CardDescription>
                  Our support team is here to help you with any questions or issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <Link href="/contact">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contact Support
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/docs">
                      <BookOpen className="mr-2 h-4 w-4" />
                      View Documentation
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

