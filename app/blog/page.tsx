import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Search } from "lucide-react";

export default function BlogPage() {
  const featuredPost = {
    id: 1,
    title: "10 Essential Tips for Acing Your Technical Interview",
    excerpt: "Master the art of technical interviews with these proven strategies from industry experts.",
    author: "Sarah Johnson",
    date: "Nov 5, 2025",
    readTime: "8 min read",
    category: "Interview Tips",
    image: "💻",
  };

  const blogPosts = [
    {
      id: 2,
      title: "How to Write a Resume That Gets Past ATS Systems",
      excerpt: "Learn the secrets to optimizing your resume for Applicant Tracking Systems.",
      author: "Michael Chen",
      date: "Nov 3, 2025",
      readTime: "6 min read",
      category: "Resume Tips",
      image: "📄",
    },
    {
      id: 3,
      title: "The STAR Method: Your Secret Weapon for Behavioral Interviews",
      excerpt: "Master behavioral questions with this simple but powerful framework.",
      author: "Emily Rodriguez",
      date: "Nov 1, 2025",
      readTime: "5 min read",
      category: "Interview Tips",
      image: "⭐",
    },
    {
      id: 4,
      title: "Common System Design Interview Mistakes and How to Avoid Them",
      excerpt: "Don't fall into these common traps when designing scalable systems.",
      author: "David Kim",
      date: "Oct 28, 2025",
      readTime: "10 min read",
      category: "Technical",
      image: "🏗️",
    },
    {
      id: 5,
      title: "Negotiating Your Job Offer: A Complete Guide",
      excerpt: "Learn how to negotiate effectively and get the compensation you deserve.",
      author: "Sarah Johnson",
      date: "Oct 25, 2025",
      readTime: "7 min read",
      category: "Career Advice",
      image: "💰",
    },
    {
      id: 6,
      title: "Remote Interview Best Practices: Setting Yourself Up for Success",
      excerpt: "Essential tips for making a great impression in virtual interviews.",
      author: "Michael Chen",
      date: "Oct 22, 2025",
      readTime: "5 min read",
      category: "Interview Tips",
      image: "🏠",
    },
    {
      id: 7,
      title: "How AI is Transforming the Interview Process",
      excerpt: "Explore how artificial intelligence is changing recruitment and interview preparation.",
      author: "Emily Rodriguez",
      date: "Oct 20, 2025",
      readTime: "6 min read",
      category: "Industry Insights",
      image: "🤖",
    },
  ];

  const categories = [
    "All Posts",
    "Interview Tips",
    "Resume Tips",
    "Technical",
    "Career Advice",
    "Industry Insights",
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-transparent dark:from-gray-800 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            PrepUp Blog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Expert insights, tips, and strategies for interview success
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search articles..." 
              className="pl-10"
            />
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((category) => (
              <Badge 
                key={category} 
                variant="secondary" 
                className="cursor-pointer hover:bg-blue-600 hover:text-white transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Featured Post */}
          <Card className="mb-12 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-12 flex items-center justify-center text-8xl">
                  {featuredPost.image}
                </div>
                <div className="p-6 flex flex-col justify-center">
                  <Badge className="w-fit mb-3">{featuredPost.category}</Badge>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {featuredPost.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <Button asChild>
                    <Link href={`/blog/${featuredPost.id}`}>Read Article</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blog Posts Grid */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Latest Articles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg h-40 flex items-center justify-center text-6xl mb-4">
                    {post.image}
                  </div>
                  <Badge className="w-fit mb-2">{post.category}</Badge>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/blog/${post.id}`}>Read More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-blue-100 mb-8">
            Get the latest interview tips, career advice, and industry insights delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              placeholder="Enter your email" 
              className="bg-white text-gray-900"
            />
            <Button variant="secondary">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

