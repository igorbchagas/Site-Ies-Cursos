// Moments.tsx
import { Camera } from 'lucide-react'; // Ícone para dar um toque visual

interface MomentsProps {
  // onNavigate é usado para a função "Voltar" (volta para a Home)
  onNavigate: (sectionId?: string) => void;
}

export function Moments({ onNavigate }: MomentsProps) {
  // Use a função onNavigate para voltar à home (topo). Passa 'hero' como seção padrão.
  const handleBackToHome = () => onNavigate('hero');

  // Classes para o botão de voltar, seguindo o padrão do AllCurse.tsx
  const backButtonClasses = `
    mb-8 flex items-center px-6 py-3 text-lg font-semibold 
    rounded-full transition duration-300 ease-in-out
    bg-[#E45B25] text-white
    hover:bg-orange-700
    active:scale-95 shadow-md hover:shadow-lg
  `;

  return (
    <div className="py-20 min-h-screen bg-white">
      <div className="container mx-auto px-4">
        
        <button onClick={handleBackToHome} className={backButtonClasses}>
          &larr; Voltar para a Página Inicial
        </button>

        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 flex items-center">
          <Camera className="w-10 h-10 text-[#E45B25] mr-3" />
          Momentos IesCursos
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mb-10">
          Reviva os melhores momentos de aprendizado, eventos, formaturas e confraternizações dos nossos alunos.
        </p>

        {/* -------------------- Galeria de Momentos (Placeholder) -------------------- */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Itens Placeholder para manter o layout */}
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div 
              key={i} 
              className="bg-gray-100 rounded-lg shadow-md aspect-video overflow-hidden 
                         flex items-center justify-center text-gray-500 border border-gray-200"
            >
              <span className="text-sm font-semibold p-4">Foto/Vídeo do Momento {i}</span>
            </div>
          ))}
          
        </div>
        <div className="col-span-full text-center mt-12">
            <p className="text-gray-500 italic text-lg p-4 border border-dashed border-gray-300 rounded-lg">
                Esta seção será alimentada com nossa galeria de fotos e vídeos dos eventos e aulas.
            </p>
        </div>
        {/* ------------------------------------------------------------------ */}
      </div>
    </div>
  );
}