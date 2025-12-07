package com.back2nokia.servlet;

import com.back2nokia.util.DBUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@WebServlet("/test-db")
public class TestDBServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        resp.setContentType("application/json;charset=UTF-8");
        try (PrintWriter out = resp.getWriter()) {
            try (Connection conn = DBUtil.getConnection()) {
                try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) AS cnt FROM users")) {
                    try (ResultSet rs = ps.executeQuery()) {
                        int cnt = 0;
                        if (rs.next()) cnt = rs.getInt("cnt");
                        out.printf("{\"status\":\"ok\",\"users\":%d}", cnt);
                    }
                }
            } catch (Exception ex) {
                ex.printStackTrace();
                String msg = ex.getClass().getSimpleName() + ": " + ex.getMessage();
                out.printf("{\"status\":\"error\",\"message\":\"%s\"}", msg.replace("\"","\\\""));
            } 
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}