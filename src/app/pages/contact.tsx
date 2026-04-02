import { motion } from 'motion/react';
import { useState } from 'react';
import { Phone, MapPin, Clock, Mail, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { toast } from 'sonner';

export function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    service: '',
    patientType: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Appointment request submitted successfully! We will contact you shortly.');
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        service: '',
        patientType: '',
        preferredDate: '',
        preferredTime: '',
        message: '',
      });
    }, 1500);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Contact & Appointment</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Get in touch with us to book an appointment or for any inquiries. We're here to help 24/7.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-xl transition-all border-t-4 border-primary">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                    <Phone className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-4">Phone</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p><a href="tel:07066694965" className="hover:text-primary transition-colors">0706 669 4965</a></p>
                    <p><a href="tel:08032240767" className="hover:text-primary transition-colors">0803 224 0767</a></p>
                    <p><a href="tel:08035868002" className="hover:text-primary transition-colors">0803 586 8002</a></p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all border-t-4 border-secondary">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-6">
                    <MapPin className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="font-bold text-xl mb-4">Address</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Umaru Gwadu Road, beside Forte Filling Station,<br />
                    Birnin Kebbi, Kebbi State,<br />
                    Nigeria
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full hover:shadow-xl transition-all border-t-4 border-accent">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-6">
                    <Clock className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="font-bold text-xl mb-4">Hours</h3>
                  <p className="text-muted-foreground text-lg font-semibold mb-2">Open 24 Hours</p>
                  <p className="text-muted-foreground">Monday - Sunday</p>
                  <p className="text-sm text-muted-foreground mt-2">(Including Public Holidays)</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Appointment Form */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Book an Appointment</h2>
            <p className="text-lg text-muted-foreground">
              Fill out the form below and we'll get back to you shortly
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-2xl">
              <CardContent className="p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. 0706 669 4965"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>

                  {/* Service Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="service">Select Service *</Label>
                    <Select value={formData.service} onValueChange={(value) => handleChange('service', value)} required>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Choose a service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family-medicine">Family Medicine</SelectItem>
                        <SelectItem value="surgery">Surgical Services</SelectItem>
                        <SelectItem value="pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="obstetrics">Obstetrics & Gynecology</SelectItem>
                        <SelectItem value="anc">Antenatal Care</SelectItem>
                        <SelectItem value="emergency">Emergency Services</SelectItem>
                        <SelectItem value="laboratory">Laboratory Services</SelectItem>
                        <SelectItem value="imaging">Imaging & Scanning</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Patient Type */}
                  <div className="space-y-2">
                    <Label htmlFor="patientType">Patient Type *</Label>
                    <Select value={formData.patientType} onValueChange={(value) => handleChange('patientType', value)} required>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select patient type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="outpatient">Outpatient</SelectItem>
                        <SelectItem value="inpatient">Inpatient</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preferred Date & Time */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">Preferred Date</Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => handleChange('preferredDate', e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredTime">Preferred Time</Label>
                      <Input
                        id="preferredTime"
                        type="time"
                        value={formData.preferredTime}
                        onChange={(e) => handleChange('preferredTime', e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>

                  {/* Message/Symptoms */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message / Symptoms</Label>
                    <Textarea
                      id="message"
                      placeholder="Please describe your symptoms or reason for visit..."
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full hover:scale-105 transition-transform text-lg py-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Submit Appointment Request
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center mt-4">
                    * Required fields. We will contact you to confirm your appointment.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Find Us</h2>
            <p className="text-lg text-muted-foreground">
              Located along Umaru Gwadu Road in Birnin Kebbi
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative h-96 bg-muted rounded-2xl overflow-hidden shadow-xl"
          >
            {/* Map Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Godiya Hospital</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Umaru Gwadu Road, Birnin Kebbi, Kebbi State
                </p>
                <Button variant="outline" asChild>
                  <a
                    href="https://www.google.com/maps/search/Godiya+Hospital+Birnin+Kebbi"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Directions
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Emergency CTA */}
      <section className="py-16 bg-red-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Medical Emergency?</h2>
            <p className="text-xl mb-6">We're open 24 hours a day. Call us immediately for urgent care.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="tel:07066694965" className="text-2xl font-bold hover:underline">0706 669 4965</a>
              <span className="hidden sm:inline">•</span>
              <a href="tel:08032240767" className="text-2xl font-bold hover:underline">0803 224 0767</a>
              <span className="hidden sm:inline">•</span>
              <a href="tel:08035868002" className="text-2xl font-bold hover:underline">0803 586 8002</a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
