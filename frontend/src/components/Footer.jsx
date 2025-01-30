function Footer() {
  return (
    <footer className="text-black py-10 px-6 md:px-12">
      <div className="flex flex-col items-center space-y-5">
            <img
                src="/public/safereport.svg"
                alt="Logo"
                className="h-12 w-12"
                style={{ filter: 'invert(80%) sepia(50%) saturate(500%) hue-rotate(90deg)' }}
            />
            <div className="space-x-7">
              <a href="/" className="hover:text-green-600">Home</a>
              <a href="/Services" className="hover:text-green-600">Services</a>
              <a href="/AboutUs" className="hover:text-green-600">About Us</a>
              <a href="/Contact" className="hover:text-green-600">Contact</a>
            </div>
      </div>
      {/* Copyright */}
      <div className="flex justify-between text-center border-t border-gray-700 mt-12 pt-4 text-base">
        <div className="">
          &copy; {new Date().getFullYear()} SafeReport. All rights reserved.
        </div>
        <div className="space-x-5">
          <a href="#" className="hover:text-green-600">Privacy Policy</a>
          <a href="#" className="hover:text-green-600">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
