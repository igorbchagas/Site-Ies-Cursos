import { MapPin, Phone, Mail, Clock, Instagram, Facebook, GraduationCap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-8 h-8 text-[#A8430F]" />
              <span className="text-2xl font-bold">Ies<span className="text-[#A8430F]">Cursos</span></span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Transformando vidas através da educação profissionalizante há mais de 15 anos.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-[#A8430F]">Links Úteis</h3>
            <ul className="space-y-2">
              <li>
                <a href="#courses" className="text-gray-400 hover:text-[#A8430F] transition-colors">
                  Cursos Presenciais
                </a>
              </li>
              <li>
                <a href="#ead-courses" className="text-gray-400 hover:text-[#A8430F] transition-colors">
                  Cursos EAD
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-400 hover:text-[#A8430F] transition-colors">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-[#A8430F] transition-colors">
                  Contato
                </a>
              </li>              
              <li>
                <a href="/ies-admin" className="text-gray-400 hover:text-[#A8430F] transition-colors">
                  Administração
                </a>
              </li>             
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-[#A8430F]">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-[#A8430F] flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">
                  Rua: Canabrava, : 100 - Centro, <br />
                  Unaí - MG, 38610-031
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#A8430F]" />
                <span className="text-gray-400 text-sm">(38) 98863-0487</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#A8430F]" />
                <span className="text-gray-400 text-sm">iescursos@gmail.com.br</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-[#A8430F]">Horário de Atendimento</h3>
            <div className="flex items-start gap-2 mb-4">
              <Clock className="w-5 h-5 text-[#A8430F] flex-shrink-0 mt-0.5" />
              <div className="text-gray-400 text-sm">
                <p>Segunda a Sexta: 08h às 21h</p>
                <p>Sábado: 10h às 12h</p>
              </div>
            </div>

            <h3 className="text-lg font-bold mb-3 text-[#A8430F]">Redes Sociais</h3>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/iescursos_unai/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#A8430F] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/institutoeducacionalsela/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#A8430F] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} IesCursos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
