package com.example.demo.controller;

import com.example.demo.dto.BookInput;
import com.example.demo.entity.Book;
import com.example.demo.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
@Slf4j
public class BookController {

    private final BookService bookService;

    @QueryMapping
    public List<Book> books() {
        log.debug("Fetching all books via GraphQL");
        return bookService.getAllBooks();
    }

    @QueryMapping
    public Book bookById(@Argument Long id) {
        log.debug("Fetching book by id: {} via GraphQL", id);
        return bookService.getBookById(id);
    }

    @QueryMapping
    public List<Book> booksByAuthor(@Argument String author) {
        log.debug("Fetching books by author: {} via GraphQL", author);
        return bookService.getBooksByAuthor(author);
    }

    @QueryMapping
    public List<Book> searchBooks(@Argument String title) {
        log.debug("Searching books by title: {} via GraphQL", title);
        return bookService.searchBooksByTitle(title);
    }

    @QueryMapping
    public Long booksCount() {
        log.debug("Getting books count via GraphQL");
        return bookService.countBooks();
    }

    @MutationMapping
    public Book addBook(@Argument @Valid BookInput input) {
        log.debug("Creating new book via GraphQL: {}", input.getTitle());
        return bookService.createBook(input.getTitle(), input.getAuthor(), input.getPublisher());
    }

    @MutationMapping
    public Book updateBook(@Argument Long id, @Argument @Valid BookInput input) {
        log.debug("Updating book id: {} via GraphQL", id);
        return bookService.updateBook(id, input.getTitle(), input.getAuthor(), input.getPublisher());
    }

    @MutationMapping
    public Boolean deleteBook(@Argument Long id) {
        log.debug("Deleting book id: {} via GraphQL", id);
        return bookService.deleteBook(id);
    }
}