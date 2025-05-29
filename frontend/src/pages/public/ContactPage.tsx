// File: frontend/src/pages/public/ContactPage.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  AlertCircle,
  CheckCircle,
  MessageSquare,
  HelpCircle,
  Users,
  Building
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ContactFormData {
  name: string
  email: string
  subject: string
  category: string
  message: string
}

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormData>()

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6 text-primary-600" />,
      title: 'Email',
      content: 'contato@tessera.com',
      subcontent: 'Respondemos em até 24h'
    },
    {
      icon: <Phone className="w-6 h-6 text-primary-600" />,
      title: 'Telefone',
      content: '+55 (11) 3456-7890',
      subcontent: 'Seg-Sex, 9h às 18h'
    },
    {
      icon: <MapPin className="w-6 h-6 text-primary-600" />,
      title: 'Endereço',
      content: 'São Paulo, SP',
      subcontent: 'Brasil'
    },
    {
      icon: <Clock className="w-6 h-6 text-primary-600" />,
      title: 'Horário de Suporte',
      content: 'Segunda a Sexta',
      subcontent: '9h às 18h (GMT-3)'
    }
  ]

  const categories = [
    { value: 'support', label: 'Suporte Técnico', icon: <HelpCircle className="w-4 h-4" /> },
    { value: 'sales', label: 'Vendas', icon: <Building className="w-4 h-4" /> },
    { value: 'partnership', label: 'Parcerias', icon: <Users className="w-4 h-4" /> },
    { value: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-4 h-4" /> },
    { value: 'other', label: 'Outros', icon: <Mail className="w-4 h-4" /> }
  ]

  const faqs = [
    {
      question: 'Como posso começar a usar a Tessera?',
      answer: 'Basta criar uma conta gratuita e aguardar a aprovação do administrador. O processo é rápido e simples.'
    },
    {
      question: 'A plataforma é gratuita?',
      answer: 'Sim! A Tessera Acadêmica é completamente gratuita para estudantes e orientadores.'
    },
    {
      question: 'Posso usar em qualquer instituição?',
      answer: 'Sim, nossa plataforma é compatível com qualquer instituição de ensino superior do Brasil.'
    },
    {
      question: 'Como funciona a colaboração em tempo real?',
      answer: 'Múltiplos usuários podem editar o mesmo documento simultaneamente, com sincronização automática e controle de conflitos.'
    }
  ]

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    
    try {
      // Simular envio do formulário
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Dados do formulário:', data)
      setSubmitted(true)
      reset()
      toast.success('Mensagem enviada com sucesso! Entraremos em contato em breve.')
      
    } catch (error) {
      toast.error('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
              Entre em Contato
            </h1>
            <p className="text-xl text-secondary-600 leading-relaxed">
              Estamos aqui para ajudar! Entre em contato conosco para tirar dúvidas, 
              solicitar suporte ou discutir como a Tessera pode beneficiar sua instituição.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-white">
        <div className="container-app">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {info.icon}
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  {info.title}
                </h3>
                <p className="text-secondary-700 font-medium">
                  {info.content}
                </p>
                <p className="text-secondary-500 text-sm">
                  {info.subcontent}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & FAQ */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container-app">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-secondary-900 mb-6">
                  Envie sua Mensagem
                </h2>

                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-success-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                      Mensagem Enviada!
                    </h3>
                    <p className="text-secondary-600">
                      Obrigado pelo contato. Responderemos em breve.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Enviar Nova Mensagem
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        className={`input ${errors.name ? 'border-danger-500' : ''}`}
                        placeholder="Seu nome completo"
                        {...register('name', { required: 'Nome é obrigatório' })}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-danger-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        className={`input ${errors.email ? 'border-danger-500' : ''}`}
                        placeholder="seu@email.com"
                        {...register('email', {
                          required: 'Email é obrigatório',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
                          }
                        })}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-danger-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Categoria
                      </label>
                      <select
                        className={`input ${errors.category ? 'border-danger-500' : ''}`}
                        {...register('category', { required: 'Selecione uma categoria' })}
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-danger-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.category.message}
                        </p>
                      )}
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Assunto
                      </label>
                      <input
                        type="text"
                        className={`input ${errors.subject ? 'border-danger-500' : ''}`}
                        placeholder="Resumo do que você precisa"
                        {...register('subject', { required: 'Assunto é obrigatório' })}
                      />
                      {errors.subject && (
                        <p className="mt-1 text-sm text-danger-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.subject.message}
                        </p>
                      )}
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Mensagem
                      </label>
                      <textarea
                        rows={5}
                        className={`input ${errors.message ? 'border-danger-500' : ''}`}
                        placeholder="Descreva detalhadamente sua solicitação..."
                        {...register('message', { required: 'Mensagem é obrigatória' })}
                      />
                      {errors.message && (
                        <p className="mt-1 text-sm text-danger-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar Mensagem</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl font-bold text-secondary-900 mb-8">
                Perguntas Frequentes
              </h2>
              
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-lg p-6 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-secondary-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Quick Help */}
              <div className="mt-8 bg-primary-50 rounded-lg p-6 border border-primary-200">
                <h3 className="text-lg font-semibold text-primary-900 mb-3">
                  Precisa de Ajuda Rápida?
                </h3>
                <p className="text-primary-700 mb-4">
                  Para suporte técnico urgente, você também pode:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-primary-700">
                    <Mail className="w-4 h-4" />
                    <span>Enviar email para: suporte@tessera.com</span>
                  </div>
                  <div className="flex items-center space-x-2 text-primary-700">
                    <MessageSquare className="w-4 h-4" />
                    <span>Acessar nossa base de conhecimento</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container-app text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-6">
              Pronto para Começar?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Crie sua conta agora mesmo e descubra como a Tessera pode 
              transformar sua experiência acadêmica.
            </p>
            <a
              href="/auth/register"
              className="btn bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-3 font-semibold"
            >
              Criar Conta Gratuita
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage