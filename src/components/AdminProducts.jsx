import React, { useState } from 'react';
import { formatPrice } from '../utils.js';

export default function AdminProducts({ products, onProductCreated, onProductUpdated, onProductDeleted, storeConfig }) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    sizes: 'S, M, L, XL',
    categories: 'Tops',
    stock: '',
    collections: 'The Eighth Archive',
    images: []
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const processFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are supported (PNG, JPG, WEBP, GIF).');
      return;
    }

    if (formData.images.length >= 4) {
      setUploadError('At most 4 images are allowed per product.');
      return;
    }
    
    setUploading(true);
    setUploadError('');
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result.split(',')[1];
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: file.name,
              data: base64Data
            })
          });
          
          if (!res.ok) {
            throw new Error('Server returned error status');
          }
          
          const result = await res.json();
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, result.url]
          }));
        } catch (err) {
          setUploadError('Failed to upload image to backend.');
          console.error(err);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError('Failed to read image file.');
      setUploading(false);
      console.error(err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (formData.images.length < 4 && !uploading) {
      setDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (formData.images.length >= 4 || uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (formData.images.length >= 4 || uploading) return;
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      price: '',
      sizes: 'S, M, L, XL',
      categories: 'Tops',
      stock: '',
      collections: 'The Eighth Archive',
      images: []
    });
    setUploadError('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      sizes: product.sizes.join(', '),
      categories: product.categories.join(', '),
      stock: product.stock,
      collections: product.collections.join(', '),
      images: Array.isArray(product.images) ? product.images : [product.images]
    });
    setUploadError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Parse arrays
    const formattedData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      sizes: formData.sizes.split(',').map(s => s.trim()).filter(s => s !== ''),
      categories: formData.categories.split(',').map(c => c.trim()).filter(c => c !== ''),
      collections: formData.collections.split(',').map(cl => cl.trim()).filter(cl => cl !== ''),
      images: formData.images.length > 0 ? formData.images : ['/images/placeholder.jpg']
    };

    try {
      if (editingProduct) {
        // Edit Mode
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData)
        });
        
        if (!res.ok) throw new Error('Failed to update product');
        const updated = await res.json();
        onProductUpdated(updated);
      } else {
        // Add Mode
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData)
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to create product');
        }
        const created = await res.json();
        onProductCreated(created);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to permanently delete this streetwear product from the archive?')) return;
    
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete product');
      onProductDeleted(productId);
    } catch (err) {
      alert(err.message || 'Deletion failed');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Search bar */}
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search products by title or ID..." 
          style={{ maxWidth: '350px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <button className="btn" onClick={openAddModal}>
          + Add Product
        </button>
      </div>

      {/* TABLE */}
      <div className="admin-panel" style={{ width: '100%' }}>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Preview</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No products found matching query.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{p.id}</td>
                    <td>
                      <img 
                        src={p.images[0]} 
                        alt={p.name} 
                        style={{ width: '40px', height: '50px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=80&q=80';
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: '500' }}>{p.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.categories.join(', ')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice(p.price, storeConfig.currency)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: p.stock === 0 ? 'var(--danger)' : p.stock <= 5 ? 'var(--warning)' : 'inherit' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-btn" onClick={() => openEditModal(p)} title="Edit Product">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button className="icon-btn" onClick={() => handleDelete(p.id)} title="Delete Product" style={{ color: 'var(--danger)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD MODAL OVERLAY */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              {editingProduct ? 'Edit Streetwear Product' : 'Add New Streetwear Product'}
            </h3>

            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="prod-id">Product ID (Unique)</label>
                  <input 
                    type="text" 
                    name="id" 
                    id="prod-id"
                    className="form-input" 
                    placeholder="e.g. NOIR-006 (or random)"
                    disabled={!!editingProduct}
                    value={formData.id}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prod-name">Product Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    id="prod-name"
                    className="form-input" 
                    required 
                    placeholder="e.g. Distressed Graphic Tee"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="prod-desc">Description</label>
                <textarea 
                  name="description" 
                  id="prod-desc"
                  className="form-input" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  required 
                  placeholder="Describe material, fit, graphic prints, capsule collection..."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="prod-price">Price ({storeConfig.currency})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="price" 
                    id="prod-price"
                    className="form-input" 
                    required 
                    placeholder="85.00"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prod-stock">Stock Inventory Qty</label>
                  <input 
                    type="number" 
                    name="stock" 
                    id="prod-stock"
                    className="form-input" 
                    required 
                    placeholder="15"
                    value={formData.stock}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="prod-sizes">Sizes (Comma Separated)</label>
                  <input 
                    type="text" 
                    name="sizes" 
                    id="prod-sizes"
                    className="form-input" 
                    placeholder="S, M, L, XL"
                    value={formData.sizes}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prod-categories">Categories (Comma Separated)</label>
                  <input 
                    type="text" 
                    name="categories" 
                    id="prod-categories"
                    className="form-input" 
                    placeholder="Tops, Hoodies"
                    value={formData.categories}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row" style={{ gridColumn: 'span 2' }}>
                <div className="form-group" style={{ width: '100%' }}>
                  <label htmlFor="prod-collections">Collections (Comma Separated)</label>
                  <input 
                    type="text" 
                    name="collections" 
                    id="prod-collections"
                    className="form-input" 
                    placeholder="The Eighth Archive, New Arrivals"
                    value={formData.collections}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                <label>Product Imagery (At most 4 images)</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (formData.images.length < 4 && !uploading) {
                      document.getElementById('file-upload-input').click();
                    }
                  }}
                  style={{
                    border: dragging ? '2px dashed var(--text-primary)' : '1px dashed var(--border-color)',
                    borderRadius: '4px',
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    cursor: formData.images.length < 4 && !uploading ? 'pointer' : 'default',
                    background: dragging ? 'rgba(255, 255, 255, 0.03)' : 'var(--bg-tertiary)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '130px',
                    opacity: formData.images.length >= 4 ? 0.7 : 1
                  }}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  
                  {uploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="spinner" style={{
                        width: '28px',
                        height: '28px',
                        border: '2px solid rgba(255,255,255,0.1)',
                        borderTopColor: 'var(--text-primary)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}></div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Uploading design files...</span>
                    </div>
                  ) : formData.images.length >= 4 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Maximum images added (4/4)
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Remove an existing image below to upload a replacement
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <span style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                        Drag & drop apparel layout here ({formData.images.length}/4)
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        or click to select from local storage
                      </span>
                    </div>
                  )}
                </div>
                
                {formData.images.length > 0 && (
                  <div style={{ marginTop: '1rem', width: '100%', textAlign: 'left' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Added Imagery Confirmation ({formData.images.length}/4)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {formData.images.map((img, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--bg-primary)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8rem'
                        }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                            marginRight: '0.5rem',
                            color: 'var(--success)'
                          }}>
                            ✓ Image {idx + 1} added: {img.split('/').pop()}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx)
                              }));
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              padding: '0.1rem 0.3rem'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {uploadError && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: '500' }}>
                    ⚠️ {uploadError}
                  </div>
                )}
                
                <div style={{ marginTop: '1rem' }}>
                  <label htmlFor="prod-images" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Or enter manual image paths/URLs (comma-separated):
                  </label>
                  <input 
                    type="text" 
                    name="images" 
                    id="prod-images"
                    className="form-input" 
                    style={{ marginTop: '0.25rem' }}
                    placeholder="/images/hoodie_black.jpg, /images/another.jpg"
                    value={Array.isArray(formData.images) ? formData.images.join(', ') : formData.images}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        images: e.target.value.split(',').map(img => img.trim()).filter(img => img !== '')
                      });
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
