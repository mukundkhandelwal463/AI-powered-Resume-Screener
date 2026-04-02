import React from 'react'
import Banner from '../Components/home/Banner'
import Hero from '../Components/home/Hero'
import Features from '../Components/home/features'
import Testimonial from '../Components/home/Testimonial'
import CallToAction from '../Components/home/CallToAction'
import Footer from '../Components/home/Footer'
import Stats from '../Components/home/Stats'
import Pricing from '../Components/home/Pricing'
import Faq from '../Components/home/Faq'

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Banner />
      <Hero />
      <Stats />
      <Features />
      <Testimonial />
      <Pricing />
      <Faq />
      <CallToAction />
      <Footer />
    </div>
  )
}

export default Home
