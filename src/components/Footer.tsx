// Footer.tsx - Versão com Cores e Estilo Moderno

import { MapPin, Phone, Mail, Clock, Instagram, Facebook } from 'lucide-react';
import logo from "./img/logo-ies-not-background-2.png"; // Ajuste o caminho conforme o seu projeto

const ACCENT_COLOR = "#E45B25"; // Laranja forte

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            {/* LOGO */}
            <div className="flex items-center gap-2 mb-4">
              <img 
                src={logo} 
                alt="Logo IesCursos" 
                className="h-12 w-auto" // Aumentado um pouco o tamanho da logo
              />
            </div>
            <p className="text-gray-400 leading-relaxed">
              Transformando vidas através da educação profissionalizante há mais de 9 anos.
            </p>
          </div>

          <div>
            <h3 className={`text-lg font-bold mb-4 text-[${ACCENT_COLOR}]`}>Links Úteis</h3>
            <ul className="space-y-2">
              <li>
                <a href="#hero" className={`text-gray-400 hover:text-[${ACCENT_COLOR}] transition-colors`}>Início</a>
              </li>
              <li>
                <a href="#courses" className={`text-gray-400 hover:text-[${ACCENT_COLOR}] transition-colors`}>Cursos Presenciais</a>
              </li>
              <li>
                <a href="#ead-courses" className={`text-gray-400 hover:text-[${ACCENT_COLOR}] transition-colors`}>Cursos EAD</a>
              </li>
              <li>
                <a href="#about" className={`text-gray-400 hover:text-[${ACCENT_COLOR}] transition-colors`}>Sobre</a>
              </li>
              <li>
                <a href="#contact" className={`text-gray-400 hover:text-[${ACCENT_COLOR}] transition-colors`}>Contato</a>
              </li>
              <li>
                <a href="/momentos" className={`text-gray-400 hover:text-[${ACCENT_COLOR}] transition-colors`}>Momentos</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={`text-lg font-bold mb-4 text-[${ACCENT_COLOR}]`}>Contato</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className={`w-5 h-5 text-[${ACCENT_COLOR}] flex-shrink-0 mt-0.5`} />
                <p className="text-gray-400 text-sm">
                  Rua Exemplo, 123 - Centro - Cidade/Estado
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Phone className={`w-5 h-5 text-[${ACCENT_COLOR}] flex-shrink-0 mt-0.5`} />
                <p className="text-gray-400 text-sm">(38) 99999-9999</p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className={`w-5 h-5 text-[${ACCENT_COLOR}] flex-shrink-0 mt-0.5`} />
                <p className="text-gray-400 text-sm">contato@iescursos.com.br</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className={`text-lg font-bold mb-4 text-[${ACCENT_COLOR}]`}>Horário</h3>
            <div className="flex items-start gap-2 mb-4">
              <Clock className={`w-5 h-5 text-[${ACCENT_COLOR}] flex-shrink-0 mt-0.5`} />
              <div className="text-gray-400 text-sm">
                <p>Segunda a Sexta: 08h às 21h</p>
                <p>Sábado: 10h às 12h</p>
              </div>
            </div>

            <h3 className={`text-lg font-bold mb-3 text-[${ACCENT_COLOR}]`}>Redes Sociais</h3>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/iescursos_unai/"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[${ACCENT_COLOR}] transition-colors`}
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/institutoeducacionalsela/"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[${ACCENT_COLOR}] transition-colors`}
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} IesCursos. Todos os direitos reservados. | Desenvolvido por Arroiz e Eduardo.</p>
        </div>
      </div>
    </footer>
  );
}