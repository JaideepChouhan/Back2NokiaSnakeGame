package com.back2nokia.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBUtil {
    // CHANGE THESE if your MySQL credentials are different
    private static final String URL = "jdbc:mysql://localhost:3306/back2nokiagame?useSSL=false&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASS = "root";

    static {
        try {
            // Ensure driver class is loaded
            Class.forName("com.mysql.cj.jdbc.Driver");
            System.out.println("JDBC Driver loaded.");
        } catch (ClassNotFoundException ex) {
            System.err.println("MySQL JDBC Driver not found. Put mysql-connector-java.jar in WEB-INF/lib or TOMCAT_HOME/lib");
            ex.printStackTrace();
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASS);
    }
}