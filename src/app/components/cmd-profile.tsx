import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { ChevronRight } from 'lucide-react';
import cmdImage from '../../assets/6b894a7d8d459f49c498cb60b8471bf6a794472a.png';

interface CMDProfileProps {
  showFullBio?: boolean;
  showButton?: boolean;
}

export function CMDProfile({ showFullBio = false, showButton = true }: CMDProfileProps) {
  const shortBio = `Dr. Abdulrahman Aliyu is the founder and owner of Godiya Hospital, a private healthcare institution committed to accessible, patient-centered medical care. With over three decades of experience in the health and medical field, he has led the hospital with a strong focus on clinical excellence, ethical practice, and continuous improvement of healthcare delivery in Birnin Kebbi and beyond.`;

  const fullBio = `Dr. Abdulrahman Aliyu is the Medical Director and Chief Executive Officer as well as the founder and owner of Godiya Hospital, a privately owned secondary healthcare centre. With more than 30 years of experience in medical practice and healthcare management, he has dedicated his career to improving community health through quality, affordable, and compassionate care.

Under his leadership, Godiya Hospital has grown into a trusted 24-hour facility offering a wide range of medical, surgical, maternal, and diagnostic services. His vision is to build a modern, patient-focused hospital that combines professional expertise, efficient systems, and humane treatment for every patient.`;

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300 group">
              <img
                src={cmdImage}
                alt="Dr. Abdulrahman Aliyu - Medical Director and CEO"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>

          {/* Right side - Text content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2 space-y-6"
          >
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                Medical Director and Chief Executive Officer
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
                Dr. Abdulrahman Aliyu
              </h2>
            </div>

            <div className="space-y-4">
              {showFullBio ? (
                <>
                  {fullBio.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-lg text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </>
              ) : (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {shortBio}
                </p>
              )}
            </div>

            {showButton && !showFullBio && (
              <Link to="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="group hover:bg-primary hover:text-white transition-all mt-4"
                >
                  Read Full Profile
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}