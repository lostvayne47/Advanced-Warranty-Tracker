package com.warrantytracker;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Route only known SPA paths; never turn missing /api requests into HTML. */
@Controller
class FrontendController {
    @GetMapping({"/", "/login", "/signup", "/dashboard", "/items", "/connections",
        "/add-warranty", "/warranties/{id}/edit"})
    String app() { return "forward:/index.html"; }
}
