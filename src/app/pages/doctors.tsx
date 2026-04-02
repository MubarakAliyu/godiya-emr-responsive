import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Users, Calendar, Clock, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

export function DoctorsPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');

  const doctors = [
    {
      name: 'Dr. Amina Yusuf',
      specialty: 'Family Medicine',
      department: 'Family Medicine',
      availability: 'Available Daily',
      description: 'Specialized in primary care, preventive medicine, and chronic disease management.',
    },
    {
      name: 'Dr. Mohammed Aliyu',
      specialty: 'General Surgery',
      department: 'Surgery',
      availability: 'Mon - Sat',
      description: 'Expert in general surgical procedures with over 10 years of experience.',
    },
    {
      name: 'Dr. Fatima Ibrahim',
      specialty: 'Pediatrics',
      department: 'Pediatrics',
      availability: 'Available Daily',
      description: 'Dedicated to providing comprehensive healthcare for children of all ages.',
    },
    {
      name: 'Dr. Ibrahim Sani',
      specialty: 'Obstetrics & Gynecology',
      department: 'Women\'s Health',
      availability: 'Mon - Fri',
      description: 'Providing compassionate care for women\'s health and pregnancy management.',
    },
    {
      name: 'Dr. Aisha Bello',
      specialty: 'Orthopedic Surgery',
      department: 'Surgery',
      availability: 'Tue - Sat',
      description: 'Specialized in musculoskeletal conditions and orthopedic surgical interventions.',
    },
    {
      name: 'Dr. Usman Garba',
      specialty: 'Internal Medicine',
      department: 'Family Medicine',
      availability: 'Available Daily',
      description: 'Expert in diagnosing and treating complex adult medical conditions.',
    },
    {
      name: 'Dr. Zainab Musa',
      specialty: 'Pediatric Surgery',
      department: 'Pediatrics',
      availability: 'Mon - Thu',
      description: 'Specialized in surgical care for infants, children, and adolescents.',
    },
    {
      name: 'Dr. Hassan Kebbi',
      specialty: 'Emergency Medicine',
      department: 'Emergency',
      availability: 'Available Daily',
      description: 'Experienced in handling urgent and critical medical emergencies.',
    },
  ];

  const departments = [
    'All Departments',
    'Family Medicine',
    'Surgery',
    'Pediatrics',
    'Women\'s Health',
    'Emergency',
  ];

  const filteredDoctors = doctors.filter((doctor) => {
    const departmentMatch =
      selectedDepartment === 'all' || doctor.department === selectedDepartment;
    const availabilityMatch =
      selectedAvailability === 'all' ||
      (selectedAvailability === 'daily' && doctor.availability === 'Available Daily');
    return departmentMatch && availabilityMatch;
  });

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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Meet Our Medical Team</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Experienced healthcare professionals dedicated to providing compassionate, evidence-based medical care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b border-border sticky top-20 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">Filter by:</span>
            </div>
            
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Family Medicine">Family Medicine</SelectItem>
                <SelectItem value="Surgery">Surgery</SelectItem>
                <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                <SelectItem value="Women's Health">Women's Health</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Availability</SelectItem>
                <SelectItem value="daily">Available Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Doctors Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No doctors found matching your filters.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredDoctors.map((doctor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                >
                  <Card className="h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group">
                    {/* Doctor Image Placeholder */}
                    <div className="h-56 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative overflow-hidden">
                      <Users className="h-24 w-24 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <CardContent className="p-6">
                      <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                        {doctor.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">{doctor.specialty}</p>
                      <p className="text-sm text-primary font-medium mb-3">{doctor.department}</p>
                      
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <Clock className="h-4 w-4 text-secondary" />
                        <span className="text-secondary font-medium">{doctor.availability}</span>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {doctor.description}
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
          )}
        </div>
      </section>

      {/* Department Directory */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Department Directory</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Quick access to all our medical departments
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Family Medicine', link: '/services' },
              { name: 'Surgical Services', link: '/services' },
              { name: 'Pediatrics', link: '/services' },
              { name: 'Women\'s Health', link: '/services' },
              { name: 'Emergency Services', link: '/services' },
              { name: 'Laboratory Services', link: '/services' },
            ].map((dept, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <Link to={dept.link}>
                  <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer border-l-4 border-primary">
                    <CardContent className="p-6 flex items-center justify-between">
                      <span className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {dept.name}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Ready to See a Doctor?
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Book an appointment with any of our experienced medical professionals today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto hover:scale-105 transition-transform shadow-xl text-lg px-8 py-6">
                  <Calendar className="mr-2 h-5 w-5" />
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