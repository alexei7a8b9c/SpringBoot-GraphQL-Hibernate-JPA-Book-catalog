package com.example.demo.repository;

import com.example.demo.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByAuthor(String author);

    List<Book> findByTitleContainingIgnoreCase(String title);

    @Query("SELECT b FROM Book b WHERE b.publisher = :publisher")
    List<Book> findByPublisher(@Param("publisher") String publisher);

    @Query("SELECT b FROM Book b ORDER BY b.createdAt DESC")
    List<Book> findAllOrderByCreatedAtDesc();
}