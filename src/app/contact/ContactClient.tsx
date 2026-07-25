'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Phone, Clock, ChevronDown, CheckCircle2, Send } from 'lucide-react';
import styles from './contact.module.css';
import { useStore } from '@/store/useStore';
import { submitContactEnquiryAction } from '@/actions/care.actions';

const FAQS = [
  {
    q: 'How do I place a return or exchange request?',
    a: 'Simply visit your Profile or contact Concierge Support within 7 days of delivery. For size adjustments, your return will be issued as instant GODSMOVE Wallet credit so you can place a fresh order immediately.',
  },
  {
    q: 'What are your delivery timelines across India?',
    a: 'All orders enjoy complimentary Pan-India shipping. Metro cities typically receive deliveries within 3–5 business days, while Tier 2/3 regions arrive in 5–7 business days.',
  },
  {
    q: 'Can I cancel an order after placing it?',
    a: 'Orders enter immediate warehouse fulfillment. If cancellation is urgent, contact Concierge Support immediately via Phone, WhatsApp, or Email. Cancellations are evaluated based on processing stage and are not guaranteed.',
  },
  {
    q: 'How does GODSMOVE Wallet credit work?',
    a: 'Returned items pass quality inspection, and store credit is instantly issued to your registered GODSMOVE Wallet. Wallet credits never expire and apply automatically at checkout for any future statement piece.',
  },
  {
    q: 'Are GODSMOVE products restocked once sold out?',
    a: 'Most drop allocations are produced in strict, limited quantities for exclusivity. Once a drop allocation is archived, restocks are extremely rare.',
  },
];

export default function ContactClient() {
  const { showToast } = useStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    orderNumber: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactEnquiryAction({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        orderNumber: form.orderNumber || undefined,
        message: form.message,
      });
      showToast('Inquiry Received', 'Our Concierge Team will respond to you within 24 hours.');
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      showToast('Submission Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrap}>
      {/* ── HERO ── */}
      <section className={styles.heroSection}>
        <span className={styles.heroEyebrow}>GODSMOVE CONCIERGE</span>
        <h1 className={styles.heroTitle}>Need Assistance?</h1>
        <p className={styles.heroSubtitle}>
          Our Concierge Team is available around the clock to assist you with allocations, sizing, and order management.
        </p>
      </section>

      {/* ── SUPPORT CARDS ── */}
      <section className={styles.cardsSection}>
        <div className={styles.cardsGrid}>
          {/* Card 1: Email */}
          <a href="mailto:support@godsmove.in" className={styles.supportCard}>
            <div className={styles.iconCircle}>
              <Mail size={22} strokeWidth={1.25} />
            </div>
            <span className={styles.cardLabel}>Email Concierge</span>
            <span className={styles.cardValue}>support@godsmove.in</span>
            <span className={styles.cardSub}>Direct Inbox Assistance</span>
          </a>

          {/* Card 2: WhatsApp */}
          <a href="https://wa.me/918827175801" target="_blank" rel="noopener noreferrer" className={styles.supportCard}>
            <div className={styles.iconCircle}>
              <MessageSquare size={22} strokeWidth={1.25} />
            </div>
            <span className={styles.cardLabel}>WhatsApp Quick Chat</span>
            <span className={styles.cardValue}>+91 8827175801</span>
            <span className={styles.cardSub}>Instant Messaging</span>
          </a>

          {/* Card 3: Call */}
          <a href="tel:+918827175801" className={styles.supportCard}>
            <div className={styles.iconCircle}>
              <Phone size={22} strokeWidth={1.25} />
            </div>
            <span className={styles.cardLabel}>24×7 Phone Line</span>
            <span className={styles.cardValue}>+91 8827175801</span>
            <span className={styles.cardSub}>Direct Telephone Support</span>
          </a>

          {/* Card 4: Response Time */}
          <div className={styles.supportCardStatic}>
            <div className={styles.iconCircle}>
              <Clock size={22} strokeWidth={1.25} />
            </div>
            <span className={styles.cardLabel}>Response Guarantee</span>
            <span className={styles.cardValue}>Within 24 Hours</span>
            <span className={styles.cardSub}>Guaranteed Inquiry Review</span>
          </div>
        </div>
      </section>

      {/* ── FORM & FAQ SECTION ── */}
      <section className={styles.mainSection}>
        <div className={styles.mainGrid}>
          {/* Contact Form */}
          <div className={styles.formContainer}>
            <h2 className={styles.sectionTitle}>Send an Inquiry</h2>
            <p className={styles.sectionDesc}>
              Fill in your details below. A dedicated Concierge representative will review your message promptly.
            </p>

            {submitted ? (
              <div className={styles.successState}>
                <CheckCircle2 size={48} className={styles.successIcon} />
                <h3>Inquiry Received</h3>
                <p>Thank you, {form.name}. Our Concierge Team has received your request and will respond to <strong>{form.email}</strong> within 24 hours.</p>
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', phone: '', orderNumber: '', subject: 'General Inquiry', message: '' });
                  }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="contact-name">Full Name *</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="contact-email">Email Address *</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="e.g. alex@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="contact-phone">Phone Number *</label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="contact-order">Order Number (Optional)</label>
                    <input
                      id="contact-order"
                      type="text"
                      placeholder="e.g. GM-10042"
                      value={form.orderNumber}
                      onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="contact-subject">Subject</label>
                  <select
                    id="contact-subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Order Status">Order Status & Tracking</option>
                    <option value="Return / Exchange">Return or Wallet Refund</option>
                    <option value="Sizing Help">Sizing & Fit Advice</option>
                    <option value="VVIP Concierge">VVIP & Tier Access Inquiry</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="contact-message">Message *</label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    placeholder="Describe how we can assist you..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? (
                    'Transmitting Inquiry...'
                  ) : (
                    <>
                      <span>Transmit Message</span>
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Accordion FAQ */}
          <div className={styles.faqContainer}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <p className={styles.sectionDesc}>Immediate answers to common concierge and logistics questions.</p>

            <div className={styles.accordion}>
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}>
                    <button
                      type="button"
                      className={styles.faqQuestion}
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={16} className={styles.faqIcon} />
                    </button>
                    {isOpen && (
                      <div className={styles.faqAnswer}>
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
