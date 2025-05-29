// File: srcs/src/components/layouts/AuthLayout.tsx
import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ArrowLeft } from 'lucide-react'

const backgroundPattern1 = `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="30"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`
const backgroundPattern2 = `url('data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="white" fill-opacity="0.1"%3E%3Cpolygon points="50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40"/%3E%3C/g%3E%3C/svg%3E')`

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Background Pattern */}
      <div className={`absolute inset-0 bg-[${backgroundPattern1}] opacity-40`} />
      
      <div className="relative min-h-screen flex">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
          {/* Background Pattern */}
          <div className={`absolute inset-0 bg-[${backgroundPattern2}] opacity-20`} />
          
          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-3 mb-12"
            >
              <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Tessera</h1>
                <p className="text-primary-200 text-sm">Acadêmica</p>
              </div>
            </motion.div>

            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-md"
            >
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                Colaboração acadêmica 
                <span className="text-primary-200"> em tempo real</span>
              </h2>
              
              <p className="text-xl text-primary-100 mb-8 leading-relaxed">
                Gerencie seus documentos acadêmicos com colaboração em tempo real, 
                controle de versões e feedback estruturado.
              </p>

              {/* Features */}
              <div className="space-y-4">
                {[
                  'Edição colaborativa em tempo real',
                  'Controle avançado de versões',
                  'Sistema de comentários contextual',
                  'Gestão de orientadores e estudantes'
                ].map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-2 h-2 bg-primary-300 rounded-full" />
                    <span className="text-primary-100">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-16 pt-8 border-t border-primary-500 border-opacity-30"
            >
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold">1000+</div>
                  <div className="text-primary-200 text-sm">Documentos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-primary-200 text-sm">Usuários</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">50+</div>
                  <div className="text-primary-200 text-sm">Instituições</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
          {/* Back to Home Button */}
          <div className="absolute top-6 left-6 lg:top-8 lg:left-8">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-secondary-600 hover:text-primary-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Voltar ao início</span>
            </Link>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-secondary-900">Tessera</h1>
                <p className="text-secondary-500 text-sm">Acadêmica</p>
              </div>
            </div>
          </div>

          {/* Auth Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-sm mx-auto"
          >
            <Outlet />
          </motion.div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-secondary-500">
              © 2024 Tessera Acadêmica. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout