import { Clock, Users, AlertTriangle, CheckCircle, BarChart3, Smartphone, Zap, Shield } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Time Wasting",
    description: "Manual roll calls consume 10+ minutes per class, reducing actual learning time"
  },
  {
    icon: Users,
    title: "Proxy Attendance",
    description: "Students mark attendance for absent friends, making records unreliable"
  },
  {
    icon: AlertTriangle,
    title: "Human Errors",
    description: "Manual data entry leads to mistakes and inconsistent attendance records"
  },
  {
    icon: BarChart3,
    title: "No Analytics",
    description: "Lack of real-time insights into student engagement patterns and trends"
  }
];

const solutions = [
  {
    icon: Zap,
    title: "Instant QR Scanning",
    description: "2.3-second average scan time saves 10+ minutes per class for actual learning"
  },
  {
    icon: Shield,
    title: "99.8% Accuracy",
    description: "Location-based QR codes eliminate proxy attendance with precise tracking"
  },
  {
    icon: CheckCircle,
    title: "Automated System",
    description: "Zero manual entry - attendance data flows directly to cloud analytics"
  },
  {
    icon: Smartphone,
    title: "Real-time Analytics",
    description: "Live dashboards show engagement patterns, trends, and actionable insights"
  }
];

const ProblemSolution = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-background via-secondary/10 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            From{" "}
            <span className="text-destructive">Manual Chaos</span>
            {" "}to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Smart Automation
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how SmartPresence eliminates traditional attendance problems with modern QR technology 
            and cloud-based analytics.
          </p>
        </div>

        {/* Before vs After Comparison */}
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Problems (Before) */}
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full border border-destructive/20 mb-4">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-semibold">Traditional Problems</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Manual Attendance Issues</h3>
            </div>

            <div className="space-y-6">
              {problems.map((problem, index) => (
                <div
                  key={index}
                  className="bg-gradient-card backdrop-blur-glass border border-destructive/10 rounded-2xl p-6 shadow-glass hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center border border-destructive/20">
                      <problem.icon className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-semibold text-foreground">
                        {problem.title}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions (After) */}
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full border border-success/20 mb-4">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold">SmartPresence Solutions</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Automated Excellence</h3>
            </div>

            <div className="space-y-6">
              {solutions.map((solution, index) => (
                <div
                  key={index}
                  className="bg-gradient-glassmorphism backdrop-blur-glass border border-success/20 rounded-2xl p-6 shadow-glass hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                      <solution.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-semibold text-foreground">
                        {solution.title}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {solution.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Comparison */}
        <div className="mt-20 bg-gradient-glassmorphism backdrop-blur-glass border border-white/20 rounded-3xl p-8 shadow-glass">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center space-y-4">
              <h4 className="text-2xl font-bold text-destructive">Traditional Method</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                  <div className="text-2xl font-bold text-destructive">15min</div>
                  <div className="text-sm text-muted-foreground">Time Wasted</div>
                </div>
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                  <div className="text-2xl font-bold text-destructive">78%</div>
                  <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <h4 className="text-2xl font-bold text-success">SmartPresence</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                  <div className="text-2xl font-bold text-success">2.3s</div>
                  <div className="text-sm text-muted-foreground">Scan Time</div>
                </div>
                <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                  <div className="text-2xl font-bold text-success">99.8%</div>
                  <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;