package com.example.demo.service;

import com.example.demo.entity.Book;
import com.example.demo.repository.BookRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BookService {

    private final BookRepository bookRepository;

    public List<Book> getAllBooks() {
        log.info("Fetching all books");
        return bookRepository.findAllOrderByCreatedAtDesc();
    }

    public Book getBookById(Long id) {
        log.info("Fetching book with id: {}", id);
        return bookRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Book not found with id: " + id));
    }

    public List<Book> getBooksByAuthor(String author) {
        log.info("Fetching books by author: {}", author);
        return bookRepository.findByAuthor(author);
    }

    public List<Book> searchBooksByTitle(String title) {
        log.info("Searching books with title containing: {}", title);
        return bookRepository.findByTitleContainingIgnoreCase(title);
    }

    public Book createBook(Book book) {
        log.info("Creating new book: {}", book.getTitle());
        return bookRepository.save(book);
    }

    public Book createBook(String title, String author, String publisher) {
        Book book = new Book();
        book.setTitle(title);
        book.setAuthor(author);
        book.setPublisher(publisher);
        return createBook(book);
    }

    public Book updateBook(Long id, Book bookDetails) {
        log.info("Updating book with id: {}", id);
        Book book = getBookById(id);

        if (bookDetails.getTitle() != null) {
            book.setTitle(bookDetails.getTitle());
        }
        if (bookDetails.getAuthor() != null) {
            book.setAuthor(bookDetails.getAuthor());
        }
        if (bookDetails.getPublisher() != null) {
            book.setPublisher(bookDetails.getPublisher());
        }

        return bookRepository.save(book);
    }

    public Book updateBook(Long id, String title, String author, String publisher) {
        Book bookDetails = new Book();
        if (title != null) bookDetails.setTitle(title);
        if (author != null) bookDetails.setAuthor(author);
        if (publisher != null) bookDetails.setPublisher(publisher);

        return updateBook(id, bookDetails);
    }

    public boolean deleteBook(Long id) {
        log.info("Deleting book with id: {}", id);
        if (bookRepository.existsById(id)) {
            bookRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public long countBooks() {
        return bookRepository.count();
    }
}