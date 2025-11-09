import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Target, Award, Heart } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const team = [
    { name: "Sarah Johnson", role: "CEO & Founder", image: "👩‍💼" },
    { name: "Michael Chen", role: "CTO", image: "👨‍💻" },
    { name: "Emily Rodriguez", role: "Head of AI", image: "👩‍🔬" },
    { name: "David Kim", role: "Head of Product", image: "👨‍🎨" },
  ];

  const values = [
    {
      icon: <Target className="h-8 w-8 text-blue-600" />,
      title: "Mission-Driven",
      description: "We're committed to helping job seekers succeed in their career journey",
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "User-First",
      description: "Every feature we build is designed with our users' success in mind",
    },
    {
      icon: <Award className="h-8 w-8 text-green-600" />,
      title: "Excellence",
      description: "We strive for the highest quality in everything we do",
    },
    {
      icon: <Heart className="h-8 w-8 text-red-600" />,
      title: "Empathy",
      description: "We understand the challenges of job searching and interview preparation",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About PrepUp
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            We're on a mission to make interview preparation accessible, effective, and personalized for everyone.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Story</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            PrepUp was founded in 2024 by a team of software engineers and career coaches who experienced 
            firsthand the challenges of interview preparation. We noticed that while there were plenty of 
            resources available, they were scattered, generic, and often not tailored to individual needs.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            We built PrepUp to solve this problem. By combining artificial intelligence with proven interview 
            preparation techniques, we created a platform that provides personalized, actionable feedback to 
            help job seekers land their dream jobs.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Today, PrepUp has helped over 10,000 professionals across various industries prepare for and 
            succeed in their interviews. We're continuously improving our platform based on user feedback 
            and the latest advancements in AI technology.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">{value.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Meet Our Team
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-6xl mb-4">{member.image}</div>
                  <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Impact</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Users Helped</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Mock Interviews</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">150+</div>
              <div className="text-blue-100">Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of professionals who've successfully landed their dream jobs with PrepUp
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

