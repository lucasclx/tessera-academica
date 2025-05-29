// File: srcs/src/pages/public/LandingPage.tsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Zap, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/stores/authStore'; // Assuming @ points to srcs/src

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-primary-600" />,
      title: 'Colaboração em Tempo Real',
      description: 'Edite documentos simultaneamente com seus colegas e orientadores.',
    },
    {
      icon: <BookOpen className="w-8 h-8 text-primary-600" />,
      title: 'Controle de Versão Detalhado',
      description: 'Acompanhe todas as alterações e reverta para versões anteriores com facilidade.',
    },
    {
      icon: <Users className="w-8 h-8 text-primary-600" />,
      title: 'Gestão Acadêmica Simplificada',
      description: 'Organize seus trabalhos, prazos e feedbacks em um único lugar.',
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary-600" />,
      title: 'Seguro e Confiável',
      description: 'Seus dados acadêmicos protegidos com as melhores práticas de segurança.',
    },
  ];

  return (
    <div className="bg-white text-secondary-800">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="py-20 md:py-32 bg-gradient-to-br from-primary-50 via-white to-secondary-50"
      >
        <div className="container-app text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 120 }}
            className="inline-block p-4 mb-6 bg-primary-100 rounded-full shadow-lg"
          >
            <BookOpen className="w-12 h-12 text-primary-600" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6 leading-tight">
            Tessera Acadêmica:<br />
            <span className="text-primary-600">Sua Plataforma Definitiva de Colaboração.</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary-600 max-w-2xl mx-auto mb-10">
            Revolucione a maneira como você escreve, gerencia e colabora em seus trabalhos acadêmicos. Foco total na produtividade e na qualidade da sua pesquisa.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-3 flex items-center group">
                Acessar Painel <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link to="/auth/register" className="btn-primary text-lg px-8 py-3 flex items-center group">
                  Comece Agora <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/auth/login" className="btn-outline text-lg px-8 py-3 border-primary-600 text-primary-600 hover:bg-primary-50">
                  Fazer Login
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container-app">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Recursos Poderosos para sua Jornada Acadêmica
            </h2>
            <p className="text-lg text-secondary-600 max-w-xl mx-auto">
              Ferramentas projetadas para facilitar cada etapa do seu trabalho, desde a concepção até a entrega final.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-primary-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">{feature.title}</h3>
                <p className="text-secondary-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-app text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para Transformar sua Experiência Acadêmica?
          </h2>
          <p className="text-lg md:text-xl opacity-90 max-w-xl mx-auto mb-10">
            Cadastre-se gratuitamente e descubra um novo nível de colaboração e eficiência.
          </p>
          <Link
            to={isAuthenticated ? "/dashboard" : "/auth/register"}
            className="btn bg-white text-primary-700 hover:bg-primary-50 text-lg px-10 py-3 shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            {isAuthenticated ? "Ir para o Dashboard" : "Criar Minha Conta"}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;