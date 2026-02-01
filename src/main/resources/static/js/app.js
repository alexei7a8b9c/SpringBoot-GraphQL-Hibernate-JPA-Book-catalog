// Configuration
const GRAPHQL_URL = 'http://localhost:8080/graphql';
const BOOKS_PER_PAGE = 5;
let currentPage = 1;
let totalBooks = 0;
let allBooks = [];
let editingBookId = null;

// DOM Elements
const bookForm = document.getElementById('bookForm');
const booksList = document.getElementById('booksList');
const pagination = document.getElementById('pagination');
const paginationInfo = document.getElementById('paginationInfo');
const totalBooksElement = document.getElementById('totalBooks');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const cancelBtn = document.getElementById('cancelBtn');
const searchInput = document.getElementById('searchInput');
const authorFilter = document.getElementById('authorFilter');

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
    toast.style.display = 'block';
}

// GraphQL Helper Function
async function executeGraphQL(query, variables = {}) {
    try {
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        });

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        return result.data;
    } catch (error) {
        console.error('GraphQL Error:', error);
        throw error;
    }
}

// Load Statistics
async function loadStatistics() {
    try {
        const query = `
            query {
                booksCount
                books {
                    author
                    publisher
                }
            }
        `;

        const data = await executeGraphQL(query);

        if (data) {
            // Total books
            totalBooksElement.textContent = data.booksCount;

            // Unique authors
            const authors = [...new Set(data.books.map(book => book.author))];
            document.getElementById('uniqueAuthors').textContent = authors.length;

            // Unique publishers
            const publishers = [...new Set(data.books.filter(book => book.publisher).map(book => book.publisher))];
            document.getElementById('uniquePublishers').textContent = publishers.length;
        }
    } catch (error) {
        showToast('Failed to load statistics', 'error');
    }
}

// Load All Books
async function loadBooks() {
    try {
        booksList.innerHTML = '<div class="loading">Loading books...</div>';

        const query = `
            query {
                books {
                    id
                    title
                    author
                    publisher
                    createdAt
                    updatedAt
                }
            }
        `;

        const data = await executeGraphQL(query);

        if (data && data.books) {
            allBooks = data.books;
            totalBooks = data.books.length;
            updateBooksDisplay();
            updatePagination();
            loadStatistics();
        }
    } catch (error) {
        showToast('Failed to load books', 'error');
        booksList.innerHTML = '<div class="error">Failed to load books. Please try again.</div>';
    }
}

// Search Books
async function searchBooks() {
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        showToast('Please enter a search term', 'warning');
        return;
    }

    try {
        booksList.innerHTML = '<div class="loading">Searching books...</div>';

        const query = `
            query SearchBooks($title: String!) {
                searchBooks(title: $title) {
                    id
                    title
                    author
                    publisher
                    createdAt
                    updatedAt
                }
            }
        `;

        const data = await executeGraphQL(query, { title: searchTerm });

        if (data && data.searchBooks) {
            allBooks = data.searchBooks;
            totalBooks = data.searchBooks.length;
            currentPage = 1;
            updateBooksDisplay();
            updatePagination();
            showToast(`Found ${totalBooks} books matching "${searchTerm}"`);
        }
    } catch (error) {
        showToast('Failed to search books', 'error');
    }
}

// Filter by Author
async function filterByAuthor() {
    const author = authorFilter.value.trim();

    if (!author) {
        showToast('Please enter an author name', 'warning');
        return;
    }

    try {
        booksList.innerHTML = '<div class="loading">Filtering books...</div>';

        const query = `
            query BooksByAuthor($author: String!) {
                booksByAuthor(author: $author) {
                    id
                    title
                    author
                    publisher
                    createdAt
                    updatedAt
                }
            }
        `;

        const data = await executeGraphQL(query, { author: author });

        if (data && data.booksByAuthor) {
            allBooks = data.booksByAuthor;
            totalBooks = data.booksByAuthor.length;
            currentPage = 1;
            updateBooksDisplay();
            updatePagination();
            showToast(`Found ${totalBooks} books by ${author}`);
        }
    } catch (error) {
        showToast('Failed to filter books', 'error');
    }
}

// Show All Books
function showAllBooks() {
    searchInput.value = '';
    authorFilter.value = '';
    loadBooks();
}

// Update Books Display
function updateBooksDisplay() {
    const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
    const endIndex = startIndex + BOOKS_PER_PAGE;
    const booksToShow = allBooks.slice(startIndex, endIndex);

    if (booksToShow.length === 0) {
        booksList.innerHTML = '<div class="no-books">No books found.</div>';
        return;
    }

    booksList.innerHTML = booksToShow.map(book => `
        <div class="book-card" data-id="${book.id}">
            <div class="book-header">
                <div>
                    <div class="book-title">${book.title}</div>
                    <div class="book-meta">
                        <span><i class="fas fa-user"></i> ${book.author}</span>
                        <span><i class="fas fa-building"></i> ${book.publisher || 'Not specified'}</span>
                        <span><i class="far fa-calendar"></i> ${formatDate(book.createdAt)}</span>
                    </div>
                </div>
                <div class="book-id">#${book.id}</div>
            </div>
            <div class="book-actions">
                <button class="action-btn edit" onclick="editBook('${book.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn delete" onclick="deleteBook('${book.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Update Pagination
function updatePagination() {
    const totalPages = Math.ceil(totalBooks / BOOKS_PER_PAGE);

    paginationInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalBooks} total books)`;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage - 1})">&laquo; Prev</button>`;
    }

    // Page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }

    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage + 1})">Next &raquo;</button>`;
    }

    pagination.innerHTML = paginationHTML;
}

// Change Page
function changePage(page) {
    currentPage = page;
    updateBooksDisplay();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Edit Book
async function editBook(id) {
    try {
        const query = `
            query GetBook($id: ID!) {
                bookById(id: $id) {
                    id
                    title
                    author
                    publisher
                }
            }
        `;

        const data = await executeGraphQL(query, { id: id });

        if (data && data.bookById) {
            const book = data.bookById;
            editingBookId = book.id;

            document.getElementById('bookId').value = book.id;
            document.getElementById('title').value = book.title;
            document.getElementById('author').value = book.author;
            document.getElementById('publisher').value = book.publisher || '';

            saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Book';
            cancelBtn.style.display = 'flex';

            showToast(`Editing book: ${book.title}`, 'warning');
        }
    } catch (error) {
        showToast('Failed to load book for editing', 'error');
    }
}

// Delete Book
async function deleteBook(id) {
    if (!confirm('Are you sure you want to delete this book?')) {
        return;
    }

    try {
        const query = `
            mutation DeleteBook($id: ID!) {
                deleteBook(id: $id)
            }
        `;

        const data = await executeGraphQL(query, { id: id });

        if (data && data.deleteBook) {
            showToast('Book deleted successfully');
            loadBooks();

            // If we were editing this book, clear the form
            if (editingBookId === id) {
                clearForm();
            }
        }
    } catch (error) {
        showToast('Failed to delete book', 'error');
    }
}

// Save Book (Create or Update)
async function saveBook(event) {
    event.preventDefault();

    const id = document.getElementById('bookId').value;
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const publisher = document.getElementById('publisher').value.trim();

    // Validation
    if (!title || !author) {
        showToast('Title and Author are required', 'error');
        return;
    }

    try {
        if (editingBookId) {
            // Update existing book
            const query = `
                mutation UpdateBook($id: ID!, $input: BookInput!) {
                    updateBook(id: $id, input: $input) {
                        id
                        title
                        author
                        publisher
                    }
                }
            `;

            const variables = {
                id: editingBookId,
                input: { title, author, publisher: publisher || null }
            };

            const data = await executeGraphQL(query, variables);

            if (data && data.updateBook) {
                showToast('Book updated successfully');
                clearForm();
                loadBooks();
            }
        } else {
            // Create new book
            const query = `
                mutation AddBook($input: BookInput!) {
                    addBook(input: $input) {
                        id
                        title
                        author
                        publisher
                    }
                }
            `;

            const variables = {
                input: { title, author, publisher: publisher || null }
            };

            const data = await executeGraphQL(query, variables);

            if (data && data.addBook) {
                showToast('Book created successfully');
                clearForm();
                loadBooks();
            }
        }
    } catch (error) {
        showToast('Failed to save book', 'error');
    }
}

// Clear Form
function clearForm() {
    bookForm.reset();
    document.getElementById('bookId').value = '';
    editingBookId = null;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Book';
    cancelBtn.style.display = 'none';
}

// Cancel Edit
function cancelEdit() {
    clearForm();
    showToast('Edit cancelled', 'warning');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadBooks();

    // Form submission
    bookForm.addEventListener('submit', saveBook);

    // Clear form button
    clearBtn.addEventListener('click', clearForm);

    // Cancel edit button
    cancelBtn.addEventListener('click', cancelEdit);

    // Search on Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBooks();
        }
    });

    // Filter on Enter key
    authorFilter.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            filterByAuthor();
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveBtn.click();
    }

    // Esc to cancel edit
    if (e.key === 'Escape' && editingBookId) {
        cancelEdit();
    }

    // F5 to refresh
    if (e.key === 'F5') {
        e.preventDefault();
        loadBooks();
    }
});