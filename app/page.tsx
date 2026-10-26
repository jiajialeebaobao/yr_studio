import { Header, Hero, Courses, Studio, Teachers, Pricing, BookingSection, Footer } from '@/components/sections';
import Schedule from '@/components/schedule';
export default function Home() {
  return <><Header /><main id="top"><Hero /><Courses /><Studio /><Teachers /><Schedule /><Pricing /><BookingSection /></main><Footer /></>;
}
