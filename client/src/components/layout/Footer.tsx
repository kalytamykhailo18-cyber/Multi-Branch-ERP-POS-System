import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          © {currentYear} POS Multi. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
            Ayuda
          </a>
          <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
            Soporte
          </a>
          <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
            Privacidad
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
