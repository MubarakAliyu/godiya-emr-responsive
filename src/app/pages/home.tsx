import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Clock,
  Bed,
  Microscope,
  Shield,
  Users,
  Stethoscope,
  Baby,
  Activity,
  Pill,
  ScanLine,
  ChevronRight,
  Syringe,
  HeartPulse,
  Apple,
  UserPlus,
  BookOpen,
  Star,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { HeroSlider } from '@/app/components/hero-slider';
import { CMDProfile } from '@/app/components/cmd-profile';

export function HomePage() {
  const stats = [
    { icon: Clock, title: 'Open 24/7', description: 'Always available — Monday to Sunday' },
    { icon: Bed, title: '26 Bed Capacity', description: 'Comfortable inpatient support' },
    { icon: Microscope, title: 'On-site Lab & Imaging', description: 'Faster diagnosis and care' },
    { icon: Shield, title: 'Licensed Facility', description: 'Registered secondary healthcare centre' },
  ];

  const services = [
    { icon: Stethoscope, title: 'Family Medicine', description: 'General consultations, preventive care, routine check-ups.' },
    { icon: Activity, title: 'Surgical Services', description: 'General surgery, orthopedics, ENT, urology, ophthalmology.' },
    { icon: Baby, title: 'Pediatrics', description: 'Child health, neonatology, gastroenterology, endocrinology.' },
    { icon: Heart, title: 'Obstetrics & Gynecology', description: 'Pregnancy care, women\'s health, fertility support.' },
    { icon: Microscope, title: 'Laboratory Services', description: 'Accurate testing and diagnostics to guide treatment.' },
    { icon: ScanLine, title: 'Imaging & Scanning', description: 'Scanning services to support fast clinical decisions.' },
    { icon: Pill, title: 'Pharmacy', description: 'Access to essential medications within the hospital.' },
  ];

  const specialClinics = [
    { icon: Syringe, title: 'Immunization', description: 'Essential vaccines for children and adults' },
    { icon: Shield, title: 'HIV/AIDS Services', description: 'Confidential testing and support' },
    { icon: Activity, title: 'Tuberculosis Care', description: 'Diagnosis and treatment programs' },
    { icon: HeartPulse, title: 'Hepatitis Support', description: 'Screening and management' },
    { icon: Heart, title: 'Non-Communicable Diseases', description: 'Diabetes, hypertension, and chronic care' },
    { icon: Apple, title: 'Nutrition & Health Education', description: 'Dietary guidance and wellness programs' },
    { icon: Baby, title: 'Maternal & Newborn Care', description: 'Complete care for mothers and babies' },
    { icon: UserPlus, title: 'Family Planning', description: 'Reproductive health services' },
  ];

  const whyChooseUsCards = [
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Round-the-clock medical care, every single day of the year. Emergency support when you need it most.',
    },
    {
      icon: Shield,
      title: 'Complete Care in One Facility',
      description: 'From consultation to diagnostics to treatment — everything available on-site for your convenience.',
    },
    {
      icon: Users,
      title: 'Community-Focused Healthcare',
      description: 'Trusted by families in Birnin Kebbi. We understand local needs and deliver compassionate care.',
    },
  ];

  const doctors = [
    { name: 'Dr. Family Medicine Specialist', specialty: 'Family Medicine', availability: 'Available Daily' },
    { name: 'Dr. Pediatric Care Expert', specialty: 'Pediatrics', availability: 'Mon - Sat' },
    { name: 'Dr. Surgical Specialist', specialty: 'General Surgery', availability: 'Available Daily' },
    { name: 'Dr. Women\'s Health Expert', specialty: 'Obstetrics & Gynecology', availability: 'Mon - Fri' },
  ];

  const testimonials = [
    { 
      name: 'Aisha Mohammed', 
      text: 'The doctors were attentive and the service was fast. I felt well cared for throughout my visit.',
      rating: 5 
    },
    { 
      name: 'Ibrahim Sani', 
      text: 'Clean environment and helpful staff. I appreciate the 24-hour availability and professionalism.',
      rating: 5 
    },
    { 
      name: 'Fatima Usman', 
      text: 'Good experience overall. They explained everything clearly and made sure I understood my treatment.',
      rating: 5 
    },
  ];

  const faqs = [
    {
      question: 'What are your opening hours?',
      answer: 'Godiya Hospital operates 24 hours a day, 7 days a week — including weekends and public holidays. We are always here for you.',
    },
    {
      question: 'How do I book an appointment?',
      answer: 'You can book an appointment through our website contact form, call our phone numbers, or visit us directly at our facility.',
    },
    {
      question: 'Do you have a laboratory and pharmacy on-site?',
      answer: 'Yes, we have both a fully-equipped laboratory and pharmacy available on-site for patient convenience and faster service.',
    },
    {
      question: 'What emergency services do you provide?',
      answer: 'We provide 24/7 accident and emergency services with qualified medical staff ready to handle urgent medical situations.',
    },
    {
      question: 'Where is the hospital located?',
      answer: 'We are located along Zuru Road in Birnin Kebbi, Kebbi State, Nigeria. You can find us easily with GPS or by asking locals.',
    },
    {
      question: 'How do I access the EMR portal?',
      answer: 'Click the "Login to EMR" button in the navigation menu. Contact our admin team if you need login credentials or support.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Trust Strip */}
      <section className="py-8 bg-white border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <Shield className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-semibold">Licensed Secondary Healthcare Centre</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <Microscope className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-semibold">On-site Diagnostics</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <Heart className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-semibold">Patient-first Care</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <Clock className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-semibold">24-Hour Operations</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-l-4 border-primary">
                  <CardContent className="p-8">
                    <stat.icon className="h-12 w-12 text-primary mb-4" />
                    <h3 className="font-bold text-xl mb-2">{stat.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{stat.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CMD Profile Section */}
      <CMDProfile showButton={true} />

      {/* About Preview */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1536064479547-7ee40b74b807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZG9jdG9yJTIwcGF0aWVudCUyMGNhcmV8ZW58MXx8fHwxNzY5NDMwMjEzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Healthcare Professional"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Compassionate Care Backed by Experience
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                At Godiya Hospital, we deliver trusted healthcare services with professionalism, respect, and timely attention. Our goal is to help every patient receive the right care, at the right time, in a safe and supportive environment.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                  <p className="text-lg">Experienced medical professionals across key specialties</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                  <p className="text-lg">Fast diagnosis with comprehensive on-site services</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                  <p className="text-lg">Clear communication and dedicated patient support</p>
                </div>
              </div>

              <Link to="/about">
                <Button size="lg" variant="outline" className="group hover:bg-primary hover:text-white transition-all">
                  Learn More About Us
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Medical Services & Departments</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Comprehensive healthcare solutions across multiple specialties, all under one roof
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <Card className="h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer border-t-4 border-primary">
                  <CardContent className="p-6">
                    <service.icon className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg mb-3">{service.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.description}</p>
                    <Link to="/services" className="inline-flex items-center text-primary font-medium text-sm group-hover:underline">
                      View Details <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/services">
              <Button size="lg" className="hover:scale-105 transition-transform shadow-lg">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Special Clinics */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Specialized Clinical Services</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Targeted programs for specific health needs and community wellness
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialClinics.map((clinic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <Card className="h-full hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                  <CardContent className="p-6 text-center">
                    <clinic.icon className="h-10 w-10 text-secondary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-base mb-2">{clinic.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{clinic.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary/90 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Why Patients Choose Godiya Hospital</h2>
            <p className="text-lg text-white/90 max-w-3xl mx-auto">
              Trusted healthcare that puts your wellbeing first
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {whyChooseUsCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
              >
                <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all hover:scale-105">
                  <CardContent className="p-8 text-center">
                    <card.icon className="h-16 w-16 text-white mx-auto mb-6" />
                    <h3 className="font-bold text-2xl mb-4 text-white">{card.title}</h3>
                    <p className="text-white/90 leading-relaxed text-lg">{card.description}</p>
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

      {/* Doctors Preview */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Meet Our Medical Team</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our team is committed to delivering safe, respectful, and evidence-based care
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {doctors.map((doctor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Users className="h-20 w-20 text-primary/40 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{doctor.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{doctor.specialty}</p>
                    <p className="text-xs text-secondary font-medium">{doctor.availability}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/doctors">
              <Button size="lg" className="hover:scale-105 transition-transform shadow-lg">
                View All Doctors
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">What Patients Say</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Real experiences from our patients
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full hover:shadow-xl transition-all">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic mb-6 leading-relaxed text-lg">
                      "{testimonial.text}"
                    </p>
                    <p className="font-semibold text-foreground">— {testimonial.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Quick answers to common questions
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`} 
                  className="bg-muted/30 px-6 rounded-xl border border-border hover:border-primary/30 transition-all"
                >
                  <AccordionTrigger className="text-left hover:text-primary font-semibold py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-primary via-primary/95 to-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Your Health Matters — Get Care Today
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto text-white/95 leading-relaxed">
              Book an appointment or contact us for medical support. We're here for you 24/7.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/contact">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto hover:scale-105 transition-transform shadow-xl text-lg px-8 py-6">
                  Book Appointment
                </Button>
              </Link>
              <a href="tel:07066694965">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto bg-white/10 border-white text-white hover:bg-white hover:text-primary hover:scale-105 transition-all shadow-xl text-lg px-8 py-6"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Call Now
                </Button>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-white/90">
              <a href="tel:07066694965" className="text-lg font-semibold hover:text-white transition-colors">
                0706 669 4965
              </a>
              <span className="hidden sm:inline">•</span>
              <a href="tel:08032240767" className="text-lg font-semibold hover:text-white transition-colors">
                0803 224 0767
              </a>
              <span className="hidden sm:inline">•</span>
              <a href="tel:08035868002" className="text-lg font-semibold hover:text-white transition-colors">
                0803 586 8002
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}