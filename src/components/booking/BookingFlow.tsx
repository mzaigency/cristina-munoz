import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceSelection } from "./ServiceSelection";
import { StylistSelection } from "./StylistSelection";
import { DateTimeSelection } from "./DateTimeSelection";
import { BookingConfirmation } from "./BookingConfirmation";

export type Service = {
  id: string;
  name: string;
  duration: number; // in minutes
  category: string;
};

export type Stylist = "cris" | "desi" | "any";

export type BookingData = {
  services: Service[];
  stylist: Stylist | null;
  date: Date | null;
  time: string | null;
  name: string;
  phone: string;
};

const allServices: Service[] = [
  { id: "1", name: "Corte chico", duration: 15, category: "Corte" },
  { id: "2", name: "Tinte", duration: 85, category: "Coloración" },
  { id: "3", name: "Mechas largas", duration: 180, category: "Coloración" },
  { id: "4", name: "Mechas cortas", duration: 90, category: "Coloración" },
  { id: "5", name: "Éclat", duration: 30, category: "Coloración" },
  { id: "6", name: "Recogido", duration: 60, category: "Peinados y Tratamientos" },
  { id: "7", name: "Peinar con bucles", duration: 25, category: "Peinados y Tratamientos" },
  { id: "8", name: "Hidratación intensiva con peinado", duration: 65, category: "Peinados y Tratamientos" },
  { id: "9", name: "Hidratación mantenimiento con peinado", duration: 45, category: "Peinados y Tratamientos" },
  { id: "10", name: "Lavar y matizar", duration: 20, category: "Peinados y Tratamientos" },
  { id: "11", name: "Cejas", duration: 10, category: "Depilación Facial" },
  { id: "12", name: "Bigote", duration: 10, category: "Depilación Facial" },
  { id: "13", name: "Labio", duration: 10, category: "Depilación Facial" },
];

export const BookingFlow = () => {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    services: [],
    stylist: null,
    date: null,
    time: null,
    name: "",
    phone: "",
  });

  const totalDuration = bookingData.services.reduce((sum, service) => sum + service.duration, 0);

  const handleServicesSelect = (services: Service[]) => {
    setBookingData({ ...bookingData, services });
    setStep(2);
  };

  const handleStylistSelect = (stylist: Stylist) => {
    setBookingData({ ...bookingData, stylist });
    setStep(3);
  };

  const handleDateTimeSelect = (date: Date, time: string) => {
    setBookingData({ ...bookingData, date, time });
    setStep(4);
  };

  const handleConfirmBooking = (name: string, phone: string) => {
    setBookingData({ ...bookingData, name, phone });
    // Here you would send the booking to the backend
    console.log("Booking confirmed:", { ...bookingData, name, phone });
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Reserva tu Cita
          </h2>
          <p className="text-lg text-muted-foreground">
            Sigue los pasos para reservar tu cita de forma rápida y sencilla
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          {/* Progress indicator */}
          <div className="mb-8 flex justify-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 w-16 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>
                {step === 1 && "Selecciona tus servicios"}
                {step === 2 && "Elige tu peluquera"}
                {step === 3 && "Selecciona fecha y hora"}
                {step === 4 && "Confirma tu reserva"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Puedes seleccionar varios servicios"}
                {step === 2 && "Elige quien te atenderá o deja que decidamos nosotras"}
                {step === 3 && `Duración total: ${totalDuration} minutos`}
                {step === 4 && "Últimos detalles para completar tu reserva"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <ServiceSelection
                  services={allServices}
                  selectedServices={bookingData.services}
                  onNext={handleServicesSelect}
                />
              )}
              {step === 2 && (
                <StylistSelection
                  selectedStylist={bookingData.stylist}
                  onNext={handleStylistSelect}
                  onBack={handleBack}
                />
              )}
              {step === 3 && (
                <DateTimeSelection
                  selectedDate={bookingData.date}
                  selectedTime={bookingData.time}
                  totalDuration={totalDuration}
                  stylist={bookingData.stylist!}
                  onNext={handleDateTimeSelect}
                  onBack={handleBack}
                />
              )}
              {step === 4 && (
                <BookingConfirmation
                  bookingData={bookingData}
                  totalDuration={totalDuration}
                  onConfirm={handleConfirmBooking}
                  onBack={handleBack}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
