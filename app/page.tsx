import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  MessageSquare,
  Search,
  Download,
  Users,
  Zap,
  Check,
  Star,
  ArrowRight,
  Sparkles,
  Shield,
  ChevronRight,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2 group">
            <div className="relative">
              <FileText className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
              <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
            <span className="text-2xl font-bold text-gray-900">Doki</span>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-900 hover:text-blue-300 hover:bg-gray-100">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 border-blue-500/30 hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Document Management
          </Badge>

          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            The Future of
            <span className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 bg-clip-text text-transparent animate-gradient-x">
              {" "}
              Document Management
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Create, edit, and collaborate on documents with the power of AI. Experience intelligent document editing
            with our Cursor-inspired interface that understands your content and helps you write better.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/register">
              <Button
                size="lg"
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-2xl hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 group"
              >
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-gray-900/20 text-gray-900 hover:bg-gray-100 hover:scale-105 transition-all duration-300"
              >
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center group">
              <div className="text-3xl font-bold text-gray-900 group-hover:text-blue-400 transition-colors duration-300">
                10K+
              </div>
              <div className="text-gray-400">Documents Created</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl font-bold text-gray-900 group-hover:text-purple-400 transition-colors duration-300">
                99.9%
              </div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl font-bold text-gray-900 group-hover:text-pink-400 transition-colors duration-300">
                5M+
              </div>
              <div className="text-gray-400">AI Interactions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-transparent to-gray-50/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features for Modern Teams</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create, manage, and collaborate on documents with AI assistance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "AI-Powered Chat",
                description:
                  "Get instant help with editing, summarizing, and improving your documents using our intelligent chatbot.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Search,
                title: "Smart Search",
                description:
                  "Find any document instantly with our powerful search functionality across all your content.",
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: Download,
                title: "Multiple Export Formats",
                description: "Export your documents to PDF, DOCX, or TXT formats with a single click.",
                color: "from-purple-500 to-violet-500",
              },
              {
                icon: Users,
                title: "Collaborative Editing",
                description: "Work together with your team in real-time on shared documents.",
                color: "from-orange-500 to-red-500",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Built with Next.js for optimal performance and seamless user experience.",
                color: "from-yellow-500 to-orange-500",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level security with end-to-end encryption and compliance standards.",
                color: "from-pink-500 to-rose-500",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="bg-white backdrop-blur-lg border-gray-200 hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} p-2 mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-gray-900 text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600 leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-gray-50/20 to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your needs. Upgrade or downgrade at any time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-white backdrop-blur-lg border-gray-200 hover:bg-gray-100 transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-gray-900 text-2xl mb-2">Starter</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  $0
                  <span className="text-lg text-gray-400 font-normal">/month</span>
                </div>
                <CardDescription className="text-gray-600">Perfect for individuals getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {["5 documents", "Basic AI assistance", "PDF export", "Community support"].map((feature, index) => (
                    <div key={index} className="flex items-center text-gray-600">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Link href="/register" className="block">
                  <Button className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-200">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-gradient-to-b from-blue-600/20 to-purple-600/20 backdrop-blur-lg border-blue-500/30 hover:scale-105 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <Badge className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                Most Popular
              </Badge>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-gray-900 text-2xl mb-2">Professional</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  $19
                  <span className="text-lg text-gray-400 font-normal">/month</span>
                </div>
                <CardDescription className="text-gray-600">For professionals and small teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    "Unlimited documents",
                    "Advanced AI features",
                    "All export formats",
                    "Real-time collaboration",
                    "Priority support",
                    "Custom templates",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center text-gray-600">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Link href="/register" className="block">
                  <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg">
                    Start Pro Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-white backdrop-blur-lg border-gray-200 hover:bg-gray-100 transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-gray-900 text-2xl mb-2">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  $99
                  <span className="text-lg text-gray-400 font-normal">/month</span>
                </div>
                <CardDescription className="text-gray-600">For large teams and organizations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    "Everything in Pro",
                    "Advanced security",
                    "SSO integration",
                    "Custom AI models",
                    "24/7 phone support",
                    "Dedicated account manager",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center text-gray-600">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Link href="/register" className="block">
                  <Button className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-200">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-transparent to-gray-50/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by Teams Worldwide</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our customers are saying about their experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Chen",
                role: "Content Manager",
                company: "TechCorp",
                content:
                  "The AI assistance has completely transformed how we create documentation. What used to take hours now takes minutes.",
                rating: 5,
              },
              {
                name: "Michael Rodriguez",
                role: "Marketing Director",
                company: "StartupXYZ",
                content:
                  "Real-time collaboration with AI suggestions is a game-changer. Our team productivity has increased by 300%.",
                rating: 5,
              },
              {
                name: "Emily Johnson",
                role: "Technical Writer",
                company: "DevTools Inc",
                content:
                  "The export functionality and document search are incredibly powerful. It's like having a personal writing assistant.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="bg-white backdrop-blur-lg border-gray-200 hover:bg-gray-100 transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="text-gray-900 font-semibold">{testimonial.name}</div>
                      <div className="text-gray-400 text-sm">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of teams who have already upgraded their document management experience with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button
                size="lg"
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-2xl hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 group"
              >
                Start Free Trial
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <div className="text-gray-400 text-sm">No credit card required • 14-day free trial</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white/40 backdrop-blur-lg border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold text-gray-900">Doki</span>
              </div>
              <p className="text-gray-600 text-sm">The future of document management with AI-powered assistance.</p>
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-600 text-sm">© 2024 Doki. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
