// Configuration
const GRAPHQL_URL = 'http://localhost:8080/graphql';
const BOOKS_PER_PAGE = 8;
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
const uniqueAuthorsElement = document.getElementById('uniqueAuthors');
const statTotalBooksElement = document.getElementById('statTotalBooks');
const statUniqueAuthorsElement = document.getElementById('statUniqueAuthors');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const cancelBtn = document.getElementById('cancelBtn');
const searchInput = document.getElementById('searchInput');
const authorFilter = document.getElementById('authorFilter');
const formMode = document.getElementById('formMode');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Book Manager...');
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

    // Form validation on blur
    document.getElementById('title').addEventListener('blur', validateTitle);
    document.getElementById('author').addEventListener('blur', validateAuthor);

    console.log('Book Manager initialized successfully');
});

// Form Validation Functions
function validateTitle() {
    const title = document.getElementById('title').value.trim();
    const errorElement = document.getElementById('titleError');

    if (!title) {
        errorElement.textContent = 'Title is required';
        return false;
    }

    if (title.length < 2) {
        errorElement.textContent = 'Title must be at least 2 characters';
        return false;
    }

    errorElement.textContent = '';
    return true;
}

function validateAuthor() {
    const author = document.getElementById('author').value.trim();
    const errorElement = document.getElementById('authorError');

    if (!author) {
        errorElement.textContent = 'Author is required';
        return false;
    }

    if (author.length < 2) {
        errorElement.textContent = 'Author must be at least 2 characters';
        return false;
    }

    errorElement.textContent = '';
    return true;
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    }[type];

    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// GraphQL Helper Function
async function executeGraphQL(query, variables = {}) {
    try {
        console.log('Executing GraphQL query:', { query, variables });

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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error(result.errors[0].message);
        }

        console.log('GraphQL response:', result.data);
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
                }
            }
        `;

        const data = await executeGraphQL(query);

        if (data) {
            // Update all statistics elements
            const count = data.booksCount;
            const authors = [...new Set(data.books.map(book => book.author))];

            totalBooksElement.textContent = `${count} books`;
            uniqueAuthorsElement.textContent = `${authors.length} authors`;
            statTotalBooksElement.textContent = count;
            statUniqueAuthorsElement.textContent = authors.length;

            console.log('Statistics loaded:', { count, authors: authors.length });
        }
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

// Load All Books
async function loadBooks() {
    try {
        booksList.innerHTML = `
            <div class="loading-state">
                <div class="spinner">
                    <i class="fas fa-book fa-spin"></i>
                </div>
                <p>Loading books...</p>
            </div>
        `;

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
            currentPage = 1;
            updateBooksDisplay();
            updatePagination();
            loadStatistics();
            showToast('Books loaded successfully');

            console.log(`Loaded ${data.books.length} books`);
        }
    } catch (error) {
        console.error('Failed to load books:', error);
        showToast('Failed to load books. Please check your connection.', 'error');
        booksList.innerHTML = `
            <div class="no-books">
                <i class="fas fa-book-open"></i>
                <p>Failed to load books. Please try again.</p>
                <p style="font-size: 0.875rem; color: var(--gray-500); margin-top: 0.5rem;">
                    Error: ${error.message}
                </p>
            </div>
        `;
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
        booksList.innerHTML = `
            <div class="loading-state">
                <div class="spinner">
                    <i class="fas fa-search fa-spin"></i>
                </div>
                <p>Searching books...</p>
            </div>
        `;

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
        console.error('Failed to search books:', error);
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
        booksList.innerHTML = `
            <div class="loading-state">
                <div class="spinner">
                    <i class="fas fa-filter fa-spin"></i>
                </div>
                <p>Filtering books...</p>
            </div>
        `;

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
        console.error('Failed to filter books:', error);
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
        booksList.innerHTML = `
            <div class="no-books">
                <i class="fas fa-book-open"></i>
                <p>No books found in the library.</p>
                <p style="font-size: 0.875rem; color: var(--gray-500); margin-top: 0.5rem;">
                    Try adding a new book or clearing your filters.
                </p>
            </div>
        `;
        return;
    }

    booksList.innerHTML = booksToShow.map(book => `
        <div class="book-card fade-in" data-id="${book.id}">
            <div class="book-header">
                <div class="book-title">${book.title}</div>
                <div class="book-id">#${book.id}</div>
            </div>
            <div class="book-meta">
                <span>
                    <i class="fas fa-user"></i>
                    ${book.author}
                </span>
                <span>
                    <i class="fas fa-building"></i>
                    ${book.publisher || 'No publisher'}
                </span>
                <span>
                    <i class="fas fa-calendar"></i>
                    Added: ${formatDate(book.createdAt)}
                </span>
            </div>
            <div class="book-actions">
                <button class="btn-edit" onclick="editBook('${book.id}')">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn-delete" onclick="deleteBook('${book.id}')">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Update Pagination
function updatePagination() {
    const totalPages = Math.ceil(totalBooks / BOOKS_PER_PAGE);

    const showingStart = (currentPage - 1) * BOOKS_PER_PAGE + 1;
    const showingEnd = Math.min(currentPage * BOOKS_PER_PAGE, totalBooks);

    paginationInfo.textContent = `Showing ${showingStart} to ${showingEnd} of ${totalBooks} books`;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `
            <button class="page-btn" onclick="changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
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
        paginationHTML += `
            <button class="page-btn" onclick="changePage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
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
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Unknown date';
    }
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

            // Fill form with book data
            document.getElementById('bookId').value = book.id;
            document.getElementById('title').value = book.title;
            document.getElementById('author').value = book.author;
            document.getElementById('publisher').value = book.publisher || '';

            // Update form mode
            const modeBadge = formMode.querySelector('.mode-badge');
            modeBadge.textContent = 'Editing';
            modeBadge.style.background = 'var(--warning)';

            // Update button text
            saveBtn.innerHTML = `
                <i class="fas fa-save"></i>
                Update Book
            `;

            // Show cancel button
            cancelBtn.style.display = 'flex';

            // Clear validation errors
            document.getElementById('titleError').textContent = '';
            document.getElementById('authorError').textContent = '';

            showToast(`Editing: ${book.title}`, 'info');

            // Scroll to form
            document.querySelector('.form-section').scrollIntoView({
                behavior: 'smooth'
            });

            console.log('Editing book:', book);
        }
    } catch (error) {
        console.error('Failed to load book for editing:', error);
        showToast('Failed to load book for editing', 'error');
    }
}

// Delete Book
async function deleteBook(id) {
    const bookCard = document.querySelector(`.book-card[data-id="${id}"]`);
    const bookTitle = bookCard ? bookCard.querySelector('.book-title').textContent : 'this book';

    if (!confirm(`Are you sure you want to delete "${bookTitle}"? This action cannot be undone.`)) {
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
            showToast(`"${bookTitle}" deleted successfully`);

            // Remove book from list with animation
            if (bookCard) {
                bookCard.style.opacity = '0';
                bookCard.style.transform = 'translateX(-100px)';
                setTimeout(() => {
                    loadBooks();
                }, 300);
            } else {
                loadBooks();
            }

            // If we were editing this book, clear the form
            if (editingBookId === id) {
                clearForm();
            }
        }
    } catch (error) {
        console.error('Failed to delete book:', error);
        showToast('Failed to delete book', 'error');
    }
}

// Save Book (Create or Update)
async function saveBook(event) {
    event.preventDefault();

    console.log('Saving book...');

    // Validate form
    const isTitleValid = validateTitle();
    const isAuthorValid = validateAuthor();

    if (!isTitleValid || !isAuthorValid) {
        showToast('Please fix validation errors', 'error');
        return;
    }

    const id = document.getElementById('bookId').value;
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const publisher = document.getElementById('publisher').value.trim();

    // Add loading state to button
    const originalBtnContent = saveBtn.innerHTML;
    const originalBtnDisabled = saveBtn.disabled;

    saveBtn.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        <span>Saving...</span>
    `;
    saveBtn.disabled = true;

    try {
        if (editingBookId) {
            // Update existing book
            console.log('Updating book:', { id: editingBookId, title, author, publisher });

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
                input: {
                    title,
                    author,
                    publisher: publisher || null
                }
            };

            const data = await executeGraphQL(query, variables);

            if (data && data.updateBook) {
                showToast('Book updated successfully');
                clearForm();
                loadBooks();
            }
        } else {
            // Create new book
            console.log('Creating book:', { title, author, publisher });

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
                input: {
                    title,
                    author,
                    publisher: publisher || null
                }
            };

            const data = await executeGraphQL(query, variables);

            if (data && data.addBook) {
                showToast('Book created successfully');
                clearForm();
                loadBooks();
            }
        }
    } catch (error) {
        console.error('Failed to save book:', error);
        showToast('Failed to save book: ' + error.message, 'error');
    } finally {
        // Restore button state
        saveBtn.innerHTML = originalBtnContent;
        saveBtn.disabled = originalBtnDisabled;
    }
}

// Clear Form
function clearForm() {
    bookForm.reset();
    document.getElementById('bookId').value = '';
    editingBookId = null;

    // Reset form mode
    const modeBadge = formMode.querySelector('.mode-badge');
    modeBadge.textContent = 'New Book';
    modeBadge.style.background = 'var(--primary-light)';

    // Reset button text
    saveBtn.innerHTML = `
        <i class="fas fa-save"></i>
        Save Book
    `;

    // Hide cancel button
    cancelBtn.style.display = 'none';

    // Clear errors
    document.getElementById('titleError').textContent = '';
    document.getElementById('authorError').textContent = '';
    document.getElementById('publisherError').textContent = '';

    showToast('Form cleared', 'info');
}

// Cancel Edit
function cancelEdit() {
    clearForm();
    showToast('Edit cancelled', 'warning');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (!saveBtn.disabled) saveBtn.click();
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

// Test function to verify fields work
function testInputFields() {
    console.log('Testing input fields...');

    const titleInput = document.getElementById('title');
    const authorInput = document.getElementById('author');
    const publisherInput = document.getElementById('publisher');

    console.log('Title input:', titleInput);
    console.log('Author input:', authorInput);
    console.log('Publisher input:', publisherInput);

    // Test setting values
    titleInput.value = 'Test Book';
    authorInput.value = 'Test Author';
    publisherInput.value = 'Test Publisher';

    console.log('Input values set successfully');
}