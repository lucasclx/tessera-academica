// File: frontend/src/pages/public/AboutPage.tsx
import { motion } from 'framer-motion'
import { BookOpen, Users, Target, Award, Mail, Linkedin, Github } from 'lucide-react'

const AboutPage = () => {
  const stats = [
    { label: 'Documentos Criados', value: '1000+' },
    { label: 'Usuários Ativos', value: '500+' },
    { label: 'Instituições', value: '50+' },
    { label: 'Satisfação', value: '98%' }
  ]

  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-primary-600" />,
      title: 'Gestão Completa de Documentos',
      description: 'Organize todos os seus trabalhos acadêmicos em um só lugar, com controle de versões avançado e histórico detalhado.'
    },
    {
      icon: <Users className="w-8 h-8 text-primary-600" />,
      title: 'Colaboração Seamless',
      description: 'Trabalhe em equipe com orientadores e colegas em tempo real, com comentários contextuais e feedback estruturado.'
    },
    {
      icon: <Target className="w-8 h-8 text-primary-600" />,
      title: 'Foco na Produtividade',
      description: 'Interface limpa e intuitiva que permite focar no que realmente importa: a qualidade do seu trabalho acadêmico.'
    },
    {
      icon: <Award className="w-8 h-8 text-primary-600" />,
      title: 'Padrões Acadêmicos',
      description: 'Ferramentas desenvolvidas especificamente para atender às necessidades e padrões do ambiente acadêmico brasileiro.'
    }
  ]

  const team = [
    {
      name: 'Prof. Dr. João Silva',
      role: 'Fundador & CEO',
      description: 'PhD em Ciência da Computação, especialista em sistemas colaborativos.',
      avatar: 'JS'
    },
    {
      name: 'Maria Santos',
      role: 'CTO',
      description: 'Engenheira de Software com 10+ anos de experiência em EdTech.',
      avatar: 'MS'
    },
    {
      name: 'Carlos Oliveira',
      role: 'Head of Product',
      description: 'Designer UX/UI focado em experiências educacionais.',
      avatar: 'CO'
    }
  ]

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              Sobre a Tessera Acadêmica
            </h1>
            <p className="text-xl text-secondary-600 leading-relaxed">
              Nascemos da necessidade de simplificar e potencializar a colaboração acadêmica. 
              Nossa missão é proporcionar as melhores ferramentas para que estudantes e orientadores 
              foquem no que realmente importa: a qualidade da pesquisa e do aprendizado.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-secondary-600 text-sm font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container-app">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
                Nossa Missão
              </h2>
              <p className="text-lg text-secondary-600 leading-relaxed">
                Democratizar o acesso a ferramentas de colaboração acadêmica de alta qualidade, 
                permitindo que instituições de ensino e pesquisadores de todo o Brasil possam 
                trabalhar de forma mais eficiente e produtiva.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-secondary-600 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
              Nossa Equipe
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Profissionais apaixonados por educação e tecnologia, dedicados a criar 
              soluções que realmente fazem a diferença no ambiente acadêmico.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {member.avatar}
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-primary-600 font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-secondary-600 text-sm">
                  {member.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-secondary-900 text-white">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Nossos Valores
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <h3 className="text-xl font-semibold mb-4">Excelência</h3>
              <p className="text-secondary-300">
                Compromisso com a qualidade em cada detalhe, desde o código até a experiência do usuário.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <h3 className="text-xl font-semibold mb-4">Colaboração</h3>
              <p className="text-secondary-300">
                Acreditamos que os melhores resultados surgem quando pessoas trabalham juntas.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <h3 className="text-xl font-semibold mb-4">Inovação</h3>
              <p className="text-secondary-300">
                Sempre buscando novas maneiras de tornar a experiência acadêmica mais eficiente.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container-app text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-6">
              Quer saber mais?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Entre em contato conosco para conhecer melhor nossas soluções 
              ou para discutir como podemos ajudar sua instituição.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <a
                href="mailto:contato@tessera.com"
                className="flex items-center space-x-2 bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span>contato@tessera.com</span>
              </a>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="p-3 bg-primary-500 hover:bg-primary-400 rounded-lg transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="p-3 bg-primary-500 hover:bg-primary-400 rounded-lg transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage