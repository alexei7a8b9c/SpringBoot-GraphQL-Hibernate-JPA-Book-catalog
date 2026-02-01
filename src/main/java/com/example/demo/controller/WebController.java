package com.example.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {

    @GetMapping("/")
    public String home() {
        return "index";
    }

    @GetMapping("/graphql-console")
    public String graphqlConsole() {
        return "graphql-console";
    }

    @GetMapping("/api-docs")
    public String apiDocs() {
        return "redirect:/graphiql";
    }
}