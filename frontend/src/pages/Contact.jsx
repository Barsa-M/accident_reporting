import React from 'react';
import { Link } from 'react-router-dom';

const Contact = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* The navigation bar stays intact */}
      <header className="text-black py-4">
        <div className="container mx-auto flex justify-center items-center space-x-6">
          <Link to="/" className="text-base">Home</Link>
          <Link to="/Services" className="text-base">Services</Link>
          <Link to="/AboutUs" className="text-base" >About Us</Link>
          <Link to="/Contact" className="text-base">Contact</Link>
          <Link to="/SignIn">
            <button className="absolute right-16 text-sm w-[100px] bg-[#0d522c] text-white py-2 rounded hover:bg-[#347752] transition">
                Sign Up
            </button>
          </Link>
        </div>
      </header>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-semibold text-center text-[#0D522C] mb-8">Get in Touch</h1>
        <div className="max-w-6xl mx-auto mb-12">
          <p className="text-lg text-gray-700 text-center mb-6">
            We are here to assist you. Feel free to reach out via any of the following channels or send us a message directly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Contact Info Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Contact Information</h2>
              <ul className="space-y-6">
                <li><strong className="text-gray-800">Phone:</strong> <a href="tel:+18001234567" className="text-[#0D522C]">+251 800 123 4567</a></li>
                <li><strong className="text-gray-800">Email:</strong> <a href="mailto:support@yourcompany.com" className="text-[#0D522C]">support@SafeReporting.com</a></li>
                <li><strong className="text-gray-800">Address:</strong> HaileSelassie Street, Addis Ababa, Ethiopia</li>
                <li><strong className="text-gray-800">Operating Hours:</strong> 24/7</li>
                <li><strong className="text-gray-800">Social Media:</strong>
                  <div className="flex space-x-4 mt-2">
                    <a href="#" className="text-[#0D522C]">Facebook</a>
                    <a href="#" className="text-[#0D522C]">Twitter</a>
                    <a href="#" className="text-[#0D522C]">Instagram</a>
                    <a href="#" className="text-[#0D522C]">LinkedIn</a>
                  </div>
                </li>
              </ul>
            </div>

            {/* Message Form Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">Send Us a Message</h2>
              <form>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-800">Name</label>
                  <input type="text" id="name" name="name" className="w-full p-3 mt-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0D522C]" />
                </div>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-800">Email</label>
                  <input type="email" id="email" name="email" className="w-full p-3 mt-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0D522C]" />
                </div>
                <div className="mb-4">
                  <label htmlFor="subject" className="block text-gray-800">Subject</label>
                  <input type="text" id="subject" name="subject" className="w-full p-3 mt-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0D522C]" />
                </div>
                <div className="mb-4">
                  <label htmlFor="message" className="block text-gray-800">Message</label>
                  <textarea id="message" name="message" rows="4" className="w-full p-3 mt-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0D522C]"></textarea>
                </div>
                <button type="submit" className="w-full bg-[#0D522C] text-white py-3 rounded-md hover:bg-green-700 transition duration-300">
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Google Map Embed */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">Our Location</h2>
            <iframe
              title="Company Location"
              className="w-full h-72 rounded-lg"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d243653.2541896477!2d-74.09729327803773!3d40.73061022560248!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2590c29b7c705%3A0x8c24c4233f64d5e2!2sNew+York%2C+NY!5e0!3m2!1sen!2sus!4v1674796599875!5m2!1sen!2sus"
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
