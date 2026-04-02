import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Eye, 
  Target, 
  Shield, 
  Users, 
  Clock, 
  Bed, 
  Microscope, 
  ScanLine, 
  Pill,
  Award,
  Lock,
  HeartHandshake,
  TrendingUp,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { CMDProfile } from '@/app/components/cmd-profile';

export function AboutPage() {
  const values = [
    { icon: Heart, title: 'Compassion & Respect', color: 'text-red-500' },
    { icon: Shield, title: 'Patient Safety', color: 'text-blue-500' },
    { icon: Target, title: 'Professional Excellence', color: 'text-green-500' },
    { icon: Clock, title: 'Timely Care', color: 'text-orange-500' },
    { icon: Users, title: 'Integrity & Trust', color: 'text-purple-500' },
  ];

  const facilities = [
    { icon: Bed, text: '26-bed capacity for inpatient care' },
    { icon: Microscope, text: 'On-site laboratory services' },
    { icon: ScanLine, text: 'On-site imaging and scanning support' },
    { icon: Pill, text: 'On-site pharmacy services' },
    { icon: Clock, text: '24-hour operations daily' },
  ];

  const commitment = [
    {
      icon: Lock,
      title: 'Safety & Privacy',
      description: 'We protect patient information and follow safety protocols in all clinical activities.',
    },
    {
      icon: HeartHandshake,
      title: 'Patient Support',
      description: 'Clear communication, empathy, and respect are at the heart of our patient care approach.',
    },
    {
      icon: Award,
      title: 'Quality Standards',
      description: 'We maintain high clinical standards and follow evidence-based medical practices.',
    },
    {
      icon: TrendingUp,
      title: 'Continuous Improvement',
      description: 'We regularly evaluate and improve our services to meet evolving healthcare needs.',
    },
  ];

  const overview = [
    {
      title: 'Who We Are',
      content: 'Godiya Hospital is a private secondary healthcare facility committed to delivering compassionate medical services in Birnin Kebbi. We serve patients from across Kebbi State and neighboring regions.',
    },
    {
      title: 'What We Do',
      content: 'We provide comprehensive medical services including family medicine, surgical care, pediatrics, obstetrics and gynecology, laboratory diagnostics, imaging, emergency services, and pharmacy support.',
    },
    {
      title: 'Our Care Approach',
      content: 'We believe in treating every patient with dignity and respect. Our approach combines clinical expertise with compassionate communication, ensuring patients understand their diagnosis and treatment options.',
    },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-primary/5 via-white to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">About Godiya Hospital</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A trusted private hospital in Birnin Kebbi providing 24-hour medical care with essential clinical services and specialist support.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Hospital Overview - Structured Blocks */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Hospital Overview</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Understanding who we are and how we serve our community
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {overview.map((block, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full hover:shadow-xl transition-all border-t-4 border-primary">
                  <CardContent className="p-8">
                    <Building2 className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-bold mb-4">{block.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{block.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwdGVhbSUyMGRvY3RvcnN8ZW58MXx8fHwxNzY5MzM1ODI5fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Medical Team"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Healthcare Built Around People</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Godiya Hospital is a private secondary healthcare facility located in Birnin Kebbi, Kebbi State, Nigeria. We provide 24/7 care and support across medical, surgical, pediatric, and women's health services.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                With on-site laboratory, imaging, and pharmacy services, our goal is to ensure patients receive timely diagnosis and treatment in one facility.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CMD Profile Section */}
      <CMDProfile showFullBio={true} showButton={false} />

      {/* Mission & Vision */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Our Mission & Vision</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Guiding principles that drive everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-2xl transition-all hover:-translate-y-2">
                <CardContent className="p-10">
                  <Target className="h-16 w-16 text-primary mb-6" />
                  <h3 className="text-2xl font-bold mb-6">Our Mission</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    To provide safe, accessible, and high-quality healthcare through compassion, professionalism, and modern clinical standards. We aim to improve the health outcomes of every patient who walks through our doors.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all hover:-translate-y-2">
                <CardContent className="p-10">
                  <Eye className="h-16 w-16 text-secondary mb-6" />
                  <h3 className="text-2xl font-bold mb-6">Our Vision</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    To be one of the most trusted healthcare providers in Kebbi State, known for reliable 24-hour service, patient-centered care, and continuous commitment to clinical excellence.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Our Core Values</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              The values that define our culture and patient care philosophy
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Card className="text-center h-full hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <CardContent className="p-8">
                    <value.icon className={`h-14 w-14 mx-auto mb-4 ${value.color}`} />
                    <h3 className="font-bold text-lg">{value.title}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Facility Highlights */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary/90 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Facility Highlights</h2>
            <p className="text-lg text-white/90 max-w-3xl mx-auto">
              Modern medical infrastructure designed for comprehensive patient care
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {facilities.map((facility, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all"
              >
                <facility.icon className="h-10 w-10 flex-shrink-0" />
                <p className="text-lg leading-relaxed">{facility.text}</p>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all"
            >
              <Shield className="h-10 w-10 flex-shrink-0" />
              <p className="text-lg leading-relaxed">Licensed secondary healthcare level facility</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Our Commitment to You</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Four pillars that ensure exceptional patient experiences
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {commitment.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-2 border-l-4 border-secondary">
                  <CardContent className="p-8">
                    <item.icon className="h-12 w-12 text-secondary mb-4" />
                    <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners & Sponsors */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Partners & Sponsors</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
              We work with trusted organizations to support accessible and quality healthcare delivery
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center items-center gap-12 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="grayscale hover:grayscale-0 transition-all duration-300"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-border">
                <h3 className="text-3xl font-bold text-primary text-center">KECHEMA</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">Healthcare Partner</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grayscale hover:grayscale-0 transition-all duration-300"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-border">
                <h3 className="text-3xl font-bold text-secondary text-center">NHIS</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">Insurance Partner</p>
              </div>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-muted-foreground mt-12 max-w-2xl mx-auto"
          >
            Partnerships and sponsorships may vary based on program availability.
          </motion.p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-secondary to-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Visit Godiya Hospital Today</h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              We are always open and ready to support your health needs with compassionate, professional care.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto hover:scale-105 transition-transform shadow-xl text-lg px-8 py-6">
                  Book Appointment
                </Button>
              </Link>
              <Link to="/services">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto bg-white/10 border-white text-white hover:bg-white hover:text-primary hover:scale-105 transition-all shadow-xl text-lg px-8 py-6"
                >
                  View Services
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}