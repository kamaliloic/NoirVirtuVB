import React, { useState } from 'react';

export default function AdminProducts({ products, onProductCreated, onProductUpdated, onProductDeleted }) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    sizes: 'S, M, L, XL',
    categories: 'Tops',
    stock: '',
    collections: 'The Eighth Archive',
    images: '/images/placeholder.jpg'
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      images: '/images/placeholder.jpg'
    });
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
      images: product.images[0]
    });
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
      images: [formData.images]
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
                        loading="lazy"
                        style={{ width: '40px', height: '50px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=80&q=80';
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: '500' }}>{p.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.categories.join(', ')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>${p.price.toFixed(2)}</td>
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
                  <label htmlFor="prod-price">Price ($ USD)</label>
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

              <div className="form-row">
                <div className="form-group">
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
                <div className="form-group">
                  <label htmlFor="prod-images">Image Path</label>
                  <input 
                    type="text" 
                    name="images" 
                    id="prod-images"
                    className="form-input" 
                    placeholder="/images/hoodie_black.jpg"
                    value={formData.images}
                    onChange={handleInputChange}
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
