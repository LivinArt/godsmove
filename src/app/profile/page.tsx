'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  Heart, 
  Wallet, 
  RotateCcw,
  LogOut,
  ChevronRight,
  Loader2,
  Trash2,
  Check,
  Download,
  AlertTriangle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ScrollReveal from '@/components/ScrollReveal';
import { getMyProfile, updateMyProfile } from '@/actions/profile.actions';
import { getMyAddresses, createAddress, deleteAddress, setDefaultAddress } from '@/actions/address.actions';
import { getMyOrders, emailInvoice } from '@/actions/order.actions';
import { getMyReturns, createReturnRequest } from '@/actions/return.actions';
import { getMyWallet } from '@/actions/wallet.actions';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import styles from './profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [collection, setCollection] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);

  // Form States
  const [personalForm, setPersonalForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [personalLoading, setPersonalLoading] = useState(false);

  const [addressForm, setAddressForm] = useState({
    firstName: '', lastName: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', phone: '', label: 'Home'
  });
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // Return Flow States
  const [returnFormOpen, setReturnFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState<any>(null);
  const [returnType, setReturnType] = useState<'RETURN_FOR_CREDIT' | 'EXCHANGE'>('RETURN_FOR_CREDIT');
  const [returnReason, setReturnReason] = useState('Size mismatch');
  const [returnComments, setReturnComments] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [prof, addrs, orders, retRequests, w] = await Promise.all([
          getMyProfile(),
          getMyAddresses(),
          getMyOrders(),
          getMyReturns(),
          getMyWallet()
        ]);

        setProfile(prof);
        setPersonalForm({
          firstName: prof?.firstName || '',
          lastName: prof?.lastName || '',
          phone: prof?.phone || ''
        });

        setAddresses(addrs);
        setCollection(orders);
        setReturns(retRequests);
        setWallet(w);
      } catch (err: any) {
        // Redirect to login if unauthorized
        showToast('Authentication Required', 'Please sign in to access your profile.');
        router.push(`/login?redirect=/profile`);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalLoading(true);
    try {
      const updated = await updateMyProfile(personalForm);
      setProfile(updated);
      showToast('Profile Updated', 'Your profile details have been saved.');
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Failed to update profile.');
    } finally {
      setPersonalLoading(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    try {
      const newAddr = await createAddress(addressForm);
      setAddresses([newAddr, ...addresses.map(a => newAddr.isDefault ? { ...a, isDefault: false } : a)]);
      setAddressFormOpen(false);
      setAddressForm({
        firstName: '', lastName: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', phone: '', label: 'Home'
      });
      showToast('Address Added', 'Delivery address saved successfully.');
    } catch (err: any) {
      showToast('Address Failed', err.message || 'Failed to save address.');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteAddress(id);
      setAddresses(addresses.filter(a => a.id !== id));
      showToast('Address Deleted', 'Saved address removed.');
    } catch (err: any) {
      showToast('Delete Failed', err.message || 'Failed to delete address.');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await setDefaultAddress(id);
      setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
      showToast('Default Updated', 'Default delivery address changed.');
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Failed to update default address.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    useStore.setState({ cart: [] });
    router.push('/');
  };

  // Trigger Return/Exchange Workflow
  const handleOpenReturnForm = (order: any, item: any) => {
    setSelectedOrder(order);
    setSelectedOrderItem(item);
    setReturnType('RETURN_FOR_CREDIT');
    setReturnReason('Size mismatch');
    setReturnComments('');
    setReturnFormOpen(true);
  };

  const handleCancelReturnForm = () => {
    setReturnFormOpen(false);
    setSelectedOrder(null);
    setSelectedOrderItem(null);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedOrderItem) return;

    setReturnLoading(true);
    try {
      const retReq = await createReturnRequest({
        orderId: selectedOrder.id,
        type: returnType,
        reason: `${returnReason}: ${returnComments}`.trim(),
        evidenceUrls: [],
        items: [
          {
            orderItemId: selectedOrderItem.id,
            quantity: selectedOrderItem.quantity,
            reason: returnReason,
          }
        ]
      });

      // Update returnRequests list
      setReturns([retReq, ...returns]);
      
      // Update returnStatus locally on order item
      setCollection(collection.map(o => {
        if (o.id === selectedOrder.id) {
          return {
            ...o,
            items: o.items.map((i: any) => i.id === selectedOrderItem.id ? { ...i, returnStatus: 'PENDING' } : i)
          };
        }
        return o;
      }));

      setReturnFormOpen(false);
      setSelectedOrder(null);
      setSelectedOrderItem(null);
      setActiveTab('returns');
      showToast('Request Submitted', 'Your return request has been submitted for QC review.');
    } catch (err: any) {
      showToast('Submission Failed', err.message || 'Failed to submit return request.');
    } finally {
      setReturnLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      await emailInvoice(orderId);
      showToast('Invoice Sent', `Invoice copy for ${orderNumber} has been emailed to you.`);
    } catch (err: any) {
      showToast('Download Failed', 'Failed to generate invoice email.');
    }
  };

  const getOrderStatusClass = (status: string) => {
    switch (status) {
      case 'DELIVERED': return styles.statusDelivered;
      case 'CANCELLED': return styles.statusCancelled;
      case 'PENDING': return styles.statusPending;
      default: return styles.statusActive;
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className={styles.loadingWrap}>
          <Loader2 className={styles.spinner} size={40} />
          <p>Retrieving your profile history...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <ScrollReveal>
              <h1 className="h1">Your Dashboard</h1>
              <p className={styles.subtitle}>Manage your profile, collections, and credits.</p>
            </ScrollReveal>
          </div>

          <div className={styles.dashboard}>
            {/* Sidebar Navigation */}
            <ScrollReveal className={styles.sidebar}>
              <nav className={styles.nav}>
                <button
                  className={`${styles.navItem} ${activeTab === 'personal' ? styles.active : ''}`}
                  onClick={() => { setActiveTab('personal'); setReturnFormOpen(false); }}
                >
                  <User size={18} />
                  <span>Your Profile</span>
                  <ChevronRight size={16} className={styles.navChevron} />
                </button>
                
                <button
                  className={`${styles.navItem} ${activeTab === 'addresses' ? styles.active : ''}`}
                  onClick={() => { setActiveTab('addresses'); setReturnFormOpen(false); }}
                >
                  <MapPin size={18} />
                  <span>Addresses</span>
                  <ChevronRight size={16} className={styles.navChevron} />
                </button>

                <button
                  className={`${styles.navItem} ${activeTab === 'collection' ? styles.active : ''}`}
                  onClick={() => { setActiveTab('collection'); setReturnFormOpen(false); }}
                >
                  <ShoppingBag size={18} />
                  <span>Your Collection</span>
                  <ChevronRight size={16} className={styles.navChevron} />
                </button>

                <button
                  className={`${styles.navItem} ${activeTab === 'returns' ? styles.active : ''}`}
                  onClick={() => { setActiveTab('returns'); setReturnFormOpen(false); }}
                >
                  <RotateCcw size={18} />
                  <span>Returns & Exchanges</span>
                  <ChevronRight size={16} className={styles.navChevron} />
                </button>

                <button
                  className={`${styles.navItem} ${activeTab === 'wallet' ? styles.active : ''}`}
                  onClick={() => { setActiveTab('wallet'); setReturnFormOpen(false); }}
                >
                  <Wallet size={18} />
                  <span>GODSMOVE Credits</span>
                  <ChevronRight size={16} className={styles.navChevron} />
                </button>

                <div className={styles.navDivider} />

                <button className={`${styles.navItem} ${styles.logoutBtn}`} onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </nav>
            </ScrollReveal>

            {/* Content Panel */}
            <ScrollReveal delay={100} className={styles.content}>
              {/* Returns Request Viewport (Takes precedence when open) */}
              {returnFormOpen && selectedOrder && selectedOrderItem && (
                <div className={styles.panel}>
                  <h2 className="h3">Request Return / Exchange</h2>
                  <p className={styles.panelDesc}>Submit request for item from Order #{selectedOrder.orderNumber}</p>
                  
                  <div className={styles.returnItemCard}>
                    <div className={styles.returnItemInfo}>
                      <span className={styles.returnItemName}>{selectedOrderItem.productName}</span>
                      <span className={styles.returnItemMeta}>Size: {selectedOrderItem.size} | Qty: {selectedOrderItem.quantity}</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitReturn} className={styles.formGrid}>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Request Type</label>
                      <div className={styles.radioGroup}>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="returnType"
                            checked={returnType === 'RETURN_FOR_CREDIT'}
                            onChange={() => setReturnType('RETURN_FOR_CREDIT')}
                          />
                          <span>Return for Store Credit</span>
                        </label>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="returnType"
                            checked={returnType === 'EXCHANGE'}
                            onChange={() => setReturnType('EXCHANGE')}
                          />
                          <span>Exchange for Different Size</span>
                        </label>
                      </div>
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Primary Reason</label>
                      <select
                        className={styles.selectInput}
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                      >
                        <option value="Size mismatch">Size mismatch (Too small/large)</option>
                        <option value="Quality not as expected">Quality not as expected</option>
                        <option value="Wrong item received">Wrong item received</option>
                        <option value="Changed mind">Changed mind</option>
                      </select>
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Additional Comments</label>
                      <textarea
                        className={styles.textarea}
                        rows={4}
                        placeholder="Provide details about fit, issue, or exchange sizing preferences..."
                        value={returnComments}
                        onChange={(e) => setReturnComments(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.buttonRow} style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                      <button type="submit" disabled={returnLoading} className="btn btn-primary">
                        {returnLoading ? <Loader2 className={styles.btnSpinner} size={14} /> : null}
                        Submit Request
                      </button>
                      <button type="button" onClick={handleCancelReturnForm} className="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 1: Personal Details */}
              {!returnFormOpen && activeTab === 'personal' && (
                <div className={styles.panel}>
                  <h2 className="h3">Your Profile</h2>
                  <p className={styles.panelDesc}>Update your personal profile details.</p>
                  
                  <form onSubmit={handleUpdateProfile} className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>First Name</label>
                      <input
                        type="text"
                        required
                        className={styles.input}
                        value={personalForm.firstName}
                        onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Last Name</label>
                      <input
                        type="text"
                        required
                        className={styles.input}
                        value={personalForm.lastName}
                        onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Email Address</label>
                      <input type="email" value={profile?.email || ''} className={styles.input} readOnly style={{ opacity: 0.65, cursor: 'not-allowed' }} />
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        required
                        pattern="[6-9]\d{9}"
                        className={styles.input}
                        placeholder="10-digit mobile"
                        value={personalForm.phone}
                        onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                      />
                    </div>
                    
                    <button type="submit" disabled={personalLoading} className="btn btn-primary" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-md)' }}>
                      {personalLoading ? <Loader2 className={styles.btnSpinner} size={14} /> : null}
                      Save Changes
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Saved Addresses */}
              {!returnFormOpen && activeTab === 'addresses' && (
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2 className="h3">Addresses</h2>
                      <p className={styles.panelDesc}>Manage saved shipping details for instant checkouts.</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => setAddressFormOpen(!addressFormOpen)}>
                      {addressFormOpen ? 'Cancel' : 'Add New'}
                    </button>
                  </div>

                  {addressFormOpen && (
                    <form onSubmit={handleCreateAddress} className={`${styles.formGrid} ${styles.addressForm}`}>
                      <div className={styles.formGroup}>
                        <label>First Name</label>
                        <input type="text" required className={styles.input} value={addressForm.firstName} onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Last Name</label>
                        <input type="text" required className={styles.input} value={addressForm.lastName} onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })} />
                      </div>
                      <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                        <label>Address Line 1</label>
                        <input type="text" required className={styles.input} value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>City</label>
                        <input type="text" required className={styles.input} value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>State</label>
                        <input type="text" required className={styles.input} value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Pincode</label>
                        <input type="text" required pattern="[1-9][0-9]{5}" className={styles.input} value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Mobile Number</label>
                        <input type="tel" required pattern="[6-9]\d{9}" className={styles.input} value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Label</label>
                        <input type="text" className={styles.input} placeholder="e.g. Home, Office" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} />
                      </div>
                      
                      <button type="submit" disabled={addressLoading} className="btn btn-primary" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-md)' }}>
                        {addressLoading ? <Loader2 className={styles.btnSpinner} size={14} /> : null}
                        Save Address
                      </button>
                    </form>
                  )}

                  {!addressFormOpen && addresses.length === 0 && (
                    <div className={styles.emptyState}>
                      <MapPin size={48} className={styles.emptyIcon} />
                      <h3 className="h3">No addresses saved.</h3>
                      <p className={styles.emptyText}>Add an address for faster checkout.</p>
                    </div>
                  )}

                  {!addressFormOpen && addresses.length > 0 && (
                    <div className={styles.addressList}>
                      {addresses.map((a: any) => (
                        <div key={a.id} className={`${styles.addressCard} ${a.isDefault ? styles.addressDefault : ''}`}>
                          <div className={styles.addressHeader}>
                            <span className={styles.addressLabel}>{a.label}</span>
                            {a.isDefault ? <span className={styles.defaultBadge}>Default</span> : null}
                          </div>
                          <p className={styles.addressName}>{a.firstName} {a.lastName}</p>
                          <p className={styles.addressDetails}>{a.line1}, {a.city}, {a.state} - {a.pincode}</p>
                          <p className={styles.addressPhone}>Phone: {a.phone}</p>
                          
                          <div className={styles.addressActions}>
                            {!a.isDefault && (
                              <button onClick={() => handleSetDefaultAddress(a.id)} className={styles.actionLink}>
                                Set Default
                              </button>
                            )}
                            <button onClick={() => handleDeleteAddress(a.id)} className={styles.deleteLink} aria-label="Delete address">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Your Collection (Formerly Orders) */}
              {!returnFormOpen && activeTab === 'collection' && (
                <div className={styles.panel}>
                  <h2 className="h3">Your Collection</h2>
                  <p className={styles.panelDesc}>Your owned GODSMOVE pieces and status updates.</p>

                  {collection.length === 0 ? (
                    <div className={styles.emptyState}>
                      <ShoppingBag size={48} className={styles.emptyIcon} />
                      <h3 className="h3">Your collection is empty.</h3>
                      <p className={styles.emptyText}>When you own a piece, it will appear in this ledger.</p>
                      <Link href="/drops" className="btn btn-primary">Browse Drops</Link>
                    </div>
                  ) : (
                    <div className={styles.ordersList}>
                      {collection.map((order: any) => (
                        <div key={order.id} className={styles.orderCard}>
                          <div className={styles.orderHeader}>
                            <div>
                              <span className={styles.orderNum}>Order #{order.orderNumber}</span>
                              <span className={styles.orderDate}>Ordered on {new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className={`${styles.orderStatus} ${getOrderStatusClass(order.status)}`}>
                              {order.status}
                            </span>
                          </div>

                          <div className={styles.orderBody}>
                            {order.items.map((item: any) => (
                              <div key={item.id} className={styles.orderItemRow}>
                                <div className={styles.orderItemDetails}>
                                  <span className={styles.itemName}>{item.productName}</span>
                                  <span className={styles.itemMeta}>Size: {item.size} | Qty: {item.quantity}</span>
                                </div>
                                <div className={styles.itemRight}>
                                  <span className={styles.itemPrice}>₹{Number(item.price).toLocaleString('en-IN')}</span>
                                  
                                  {order.status === 'DELIVERED' && !item.returnStatus && (
                                    <button
                                      onClick={() => handleOpenReturnForm(order, item)}
                                      className={styles.itemReturnBtn}
                                    >
                                      Return / Exchange
                                    </button>
                                  )}
                                  {item.returnStatus && (
                                    <span className={styles.itemReturnStatusBadge}>
                                      Return: {item.returnStatus}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Shipment ETA Timeline indicator */}
                          {order.shipment && (
                            <div className={styles.shipmentTracking}>
                              <span className={styles.trackingTitle}>Delivery Tracker ({order.shipment.carrier})</span>
                              <div className={styles.trackingTimeline}>
                                <div className={`${styles.timelineStep} ${styles.timelineStepActive}`}>
                                  <div className={styles.stepDot} />
                                  <span>Confirmed</span>
                                </div>
                                <div className={`${styles.timelineStep} ${order.status !== 'PENDING' ? styles.timelineStepActive : ''}`}>
                                  <div className={styles.stepDot} />
                                  <span>Processed</span>
                                </div>
                                <div className={`${styles.timelineStep} ${['SHIPPED', 'DELIVERED'].includes(order.status) ? styles.timelineStepActive : ''}`}>
                                  <div className={styles.stepDot} />
                                  <span>Shipped</span>
                                </div>
                                <div className={`${styles.timelineStep} ${order.status === 'DELIVERED' ? styles.timelineStepActive : ''}`}>
                                  <div className={styles.stepDot} />
                                  <span>Delivered</span>
                                </div>
                              </div>
                              {order.shipment.trackingNumber && (
                                <p className={styles.trackingNum}>
                                  AWB: <strong>{order.shipment.trackingNumber}</strong>
                                </p>
                              )}
                            </div>
                          )}

                          <div className={styles.orderFooter}>
                            <button
                              onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                              className={styles.invoiceBtn}
                            >
                              <Download size={14} />
                              Download Invoice
                            </button>
                            <span className={styles.orderTotal}>Total: <strong>₹{Number(order.total).toLocaleString('en-IN')}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Returns & Exchanges ledger */}
              {!returnFormOpen && activeTab === 'returns' && (
                <div className={styles.panel}>
                  <h2 className="h3">Returns & Exchanges</h2>
                  <p className={styles.panelDesc}>Track your reverse logistics, quality controls, and refund credits.</p>

                  {returns.length === 0 ? (
                    <div className={styles.emptyState}>
                      <RotateCcw size={48} className={styles.emptyIcon} />
                      <h3 className="h3">No active requests.</h3>
                      <p className={styles.emptyText}>If you need to submit a return, start by selecting a piece from Your Collection.</p>
                    </div>
                  ) : (
                    <div className={styles.returnsList}>
                      {returns.map((ret: any) => (
                        <div key={ret.id} className={styles.returnCard}>
                          <div className={styles.returnHeader}>
                            <div>
                              <span className={styles.returnType}>{ret.type?.replace(/_/g, ' ')}</span>
                              <span className={styles.returnDate}>Requested on {new Date(ret.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className={`${styles.returnStatus} ${ret.status === 'APPROVED' ? styles.statusDelivered : ret.status === 'REJECTED' ? styles.statusCancelled : styles.statusPending}`}>
                              {ret.status}
                            </span>
                          </div>

                          <div className={styles.returnBody}>
                            <p className={styles.returnReason}>Reason: <strong>{ret.reason}</strong></p>
                            
                            {/* QC events milestones */}
                            {ret.events && ret.events.length > 0 && (
                              <div className={styles.qcEvents}>
                                <span className={styles.qcEventsTitle}>Status History</span>
                                <div className={styles.qcTimeline}>
                                  {ret.events.map((ev: any) => (
                                    <div key={ev.id} className={styles.qcEventStep}>
                                      <span className={styles.eventTime}>{new Date(ev.timestamp).toLocaleDateString()}</span>
                                      <span className={styles.eventDesc}>{ev.description}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Store Credits (Wallet) */}
              {!returnFormOpen && activeTab === 'wallet' && (
                <div className={styles.panel}>
                  <h2 className="h3">GODSMOVE Credits</h2>
                  <p className={styles.panelDesc}>Your available balance and refund transaction ledger.</p>

                  <div className={styles.walletCard}>
                    <span className="caption" style={{ color: 'var(--smoke)' }}>Available Balance</span>
                    <h2 className="display" style={{ margin: 'var(--space-sm) 0', color: '#c8a46a' }}>
                      ₹{wallet ? Number(wallet.balance).toLocaleString('en-IN') : '0.00'}
                    </h2>
                    <p className={styles.panelDesc}>Applied automatically at checkout to reduce payable totals.</p>
                  </div>

                  <div className={styles.transactions}>
                    <h3 className="h4" style={{ marginBottom: 16 }}>Transaction Ledger</h3>
                    {!wallet || !wallet.transactions || wallet.transactions.length === 0 ? (
                      <p className={styles.panelDesc}>No recent credit transactions found.</p>
                    ) : (
                      <div className={styles.txnList}>
                        {wallet.transactions.map((tx: any) => (
                          <div key={tx.id} className={styles.txnRow}>
                            <div>
                              <span className={styles.txnType}>{tx.type?.replace(/_/g, ' ')}</span>
                              <span className={styles.txnDate}>{new Date(tx.createdAt).toLocaleDateString()}</span>
                              {tx.description && <p className={styles.txnDesc}>{tx.description}</p>}
                            </div>
                            <span className={`${styles.txnAmt} ${tx.amount > 0 ? styles.txnPositive : styles.txnNegative}`}>
                              {tx.amount > 0 ? '+' : ''}₹{Number(tx.amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ScrollReveal>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
