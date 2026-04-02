import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Stethoscope,
  Activity,
  Baby,
  Heart,
  Syringe,
  AlertCircle,
  Shield,
  TrendingUp,
  BedDouble,
  Apple,
  ScanLine,
  Microscope,
  Pill,
  Eye,
  Bone,
  Ear,
  Droplet,
  Brain,
  Pill as PillIcon,
  Search,
  Phone,
  Calendar,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';

export function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const allServices = [
    // Medical Services
    {
      category: 'Medical Services',
      icon: Stethoscope,
      services: [
        {
          name: 'Family Medicine',
          description: 'Comprehensive primary care for adults and families. Includes routine check-ups, preventive care, health screening, chronic disease management, and general consultations.',
        },
      ],
    },

    // Surgical Services
    {
      category: 'Surgical Services',
      icon: Activity,
      services: [
        {
          name: 'General Surgery',
          description: 'Surgical procedures for various conditions including abdominal surgery, hernia repair, and soft tissue operations.',
        },
        {
          name: 'Orthopedic Surgery',
          description: 'Treatment of musculoskeletal conditions including fractures, joint problems, and bone disorders.',
        },
        {
          name: 'Ophthalmology',
          description: 'Eye care services including cataract surgery, eye examinations, and treatment of eye conditions.',
        },
        {
          name: 'Urology',
          description: 'Diagnosis and treatment of urinary tract and male reproductive system conditions.',
        },
        {
          name: 'ENT (Ear, Nose & Throat)',
          description: 'Treatment of ear, nose, throat conditions, sinus problems, and related surgical procedures.',
        },
        {
          name: 'Pediatric Surgery',
          description: 'Surgical care specifically designed for infants, children, and adolescents.',
        },
        {
          name: 'Radiology',
          description: 'Medical imaging services to support diagnosis and treatment planning.',
        },
        {
          name: 'Pathology',
          description: 'Laboratory analysis of tissue samples to support accurate diagnosis.',
        },
      ],
    },

    // Pediatrics
    {
      category: 'Pediatrics',
      icon: Baby,
      services: [
        {
          name: 'General Pediatric Care',
          description: 'Comprehensive healthcare for children from birth through adolescence.',
        },
        {
          name: 'Gastroenterology',
          description: 'Treatment of digestive system disorders in children.',
        },
        {
          name: 'Pulmonology',
          description: 'Respiratory and lung care for pediatric patients.',
        },
        {
          name: 'Nephrology',
          description: 'Kidney and urinary system care for children.',
        },
        {
          name: 'Neonatology',
          description: 'Specialized care for newborns, especially premature or critically ill infants.',
        },
        {
          name: 'Endocrinology',
          description: 'Hormone and metabolic disorder management in children.',
        },
        {
          name: 'Child Psychiatry / Behavioral Medicine',
          description: 'Mental health and behavioral support for children and adolescents.',
        },
      ],
    },

    // Women's Health
    {
      category: "Women's Health",
      icon: Heart,
      services: [
        {
          name: 'Obstetrics',
          description: 'Pregnancy care including prenatal visits, delivery services, and postnatal support.',
        },
        {
          name: 'Gynecology',
          description: 'Women\'s reproductive health services including examinations, treatments, and gynecological surgery.',
        },
        {
          name: 'Fertility / Assisted Reproductive Techniques',
          description: 'Fertility assessment and support for couples trying to conceive.',
        },
      ],
    },

    // Special Clinical Services
    {
      category: 'Special Clinical Services',
      icon: Shield,
      services: [
        {
          name: 'Antenatal Care (ANC)',
          description: 'Comprehensive pregnancy monitoring and maternal health support throughout pregnancy.',
        },
        {
          name: 'Immunization',
          description: 'Routine vaccines for children and adults to prevent infectious diseases.',
        },
        {
          name: 'HIV/AIDS Services',
          description: 'Confidential testing, counseling, treatment, and ongoing support.',
        },
        {
          name: 'Tuberculosis (TB) Care',
          description: 'Diagnosis, treatment, and monitoring of tuberculosis cases.',
        },
        {
          name: 'Non-Communicable Disease (NCD) Management',
          description: 'Care for chronic conditions like diabetes, hypertension, and heart disease.',
        },
        {
          name: 'Intensive Care',
          description: 'Critical care for patients requiring constant monitoring and advanced medical support.',
        },
        {
          name: 'Hepatitis Support',
          description: 'Screening, management, and treatment of hepatitis infections.',
        },
        {
          name: 'Accidents & Emergency',
          description: '24/7 emergency medical services for urgent and life-threatening conditions.',
        },
        {
          name: 'Nutrition & Health Education',
          description: 'Dietary counseling, nutritional support, and health awareness programs.',
        },
        {
          name: 'Health Education & Community Mobilization',
          description: 'Community outreach, health campaigns, and public health education.',
        },
        {
          name: 'Maternal & Newborn Care',
          description: 'Specialized care for mothers and newborns during and after delivery.',
        },
        {
          name: 'Family Planning',
          description: 'Reproductive health services and contraceptive counseling.',
        },
      ],
    },

    // Diagnostic Services
    {
      category: 'Diagnostic Services',
      icon: Microscope,
      services: [
        {
          name: 'Laboratory Services',
          description: 'Comprehensive blood tests, urinalysis, microbiology, and other diagnostic laboratory tests.',
        },
        {
          name: 'Imaging & Scanning',
          description: 'Medical imaging including ultrasound and other scanning services to support diagnosis.',
        },
      ],
    },

    // Support Services
    {
      category: 'Support Services',
      icon: Pill,
      services: [
        {
          name: 'Pharmacy',
          description: 'On-site pharmacy providing essential medications and pharmaceutical counseling.',
        },
      ],
    },
  ];

  const filteredServices = allServices
    .map((category) => ({
      ...category,
      services: category.services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.services.length > 0);

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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Our Medical Services</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Comprehensive healthcare across multiple specialties, all available under one roof with on-site diagnostics and pharmacy support.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg border-2 focus:border-primary rounded-xl"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Categories */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No services found matching your search.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {filteredServices.map((category, categoryIndex) => (
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-primary/10 rounded-xl">
                      <category.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold">{category.category}</h2>
                    </div>
                  </div>

                  {/* Services Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.services.map((service, serviceIndex) => (
                      <motion.div
                        key={serviceIndex}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: serviceIndex * 0.05, duration: 0.4 }}
                      >
                        <Card className="h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group border-l-4 border-primary">
                          <CardContent className="p-6">
                            <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">
                              {service.name}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed mb-4">
                              {service.description}
                            </p>
                            <Link to="/contact">
                              <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-white transition-all">
                                <Calendar className="mr-2 h-4 w-4" />
                                Book Appointment
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Specialized Care Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1656337426953-554b8e5b50f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3NwaXRhbCUyMGxhYm9yYXRvcnklMjBlcXVpcG1lbnR8ZW58MXx8fHwxNzY5NDMwMjEzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Laboratory Equipment"
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Integrated Healthcare Solutions
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Our medical departments work together to provide integrated care. From routine check-ups to complex surgical procedures, our team is equipped to handle diverse medical needs with professionalism and compassion.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                With on-site laboratory and imaging facilities, we deliver faster diagnosis and treatment plans, ensuring you receive comprehensive care without unnecessary delays.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/contact">
                  <Button size="lg" className="w-full sm:w-auto hover:scale-105 transition-transform">
                    Book Appointment
                  </Button>
                </Link>
                <Link to="/doctors">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto hover:scale-105 transition-transform">
                    Meet Our Doctors
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-primary via-primary/95 to-secondary text-white relative overflow-hidden">
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Need Help Choosing a Service?
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Our team is here to guide you to the right department and ensure you receive the care you need.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto hover:scale-105 transition-transform shadow-xl text-lg px-8 py-6">
                  Contact Us
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
          </motion.div>
        </div>
      </section>
    </div>
  );
}