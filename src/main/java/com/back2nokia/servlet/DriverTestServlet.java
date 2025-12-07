package com.back2nokia.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Driver;
import java.sql.DriverManager;
import java.util.Enumeration;
import java.util.Set;
import java.util.TreeSet;

@WebServlet("/driver-test")
public class DriverTestServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("text/plain; charset=UTF-8");
        try (PrintWriter out = resp.getWriter()) {
            out.println("Driver test — start\n");

            // 1) Attempt to Class.forName explicitly (helpful)
            try {
                Class.forName("com.mysql.cj.jdbc.Driver");
                out.println("Class.forName(\"com.mysql.cj.jdbc.Driver\") succeeded.");
            } catch (Throwable t) {
                out.println("Class.forName failed: " + t.getClass().getSimpleName() + " - " + t.getMessage());
            }
            out.println();

            // 2) List loaded drivers from DriverManager
            out.println("Drivers registered in DriverManager:");
            Enumeration<Driver> drivers = DriverManager.getDrivers();
            Set<String> driverNames = new TreeSet<>();
            while (drivers.hasMoreElements()) {
                Driver d = drivers.nextElement();
                driverNames.add(d.getClass().getName() + " -- " + d);
            }
            if (driverNames.isEmpty()) {
                out.println("  (none)");
            } else {
                for (String s : driverNames) out.println("  " + s);
            }
            out.println();

            // 3) List WEB-INF/lib contents (best-effort)
            out.println("WEB-INF/lib contents (ServletContext):");
            try {
                var ctx = getServletContext();
                var paths = ctx.getResourcePaths("/WEB-INF/lib/");
                if (paths == null || paths.isEmpty()) {
                    out.println("  (no entries found via ServletContext.getResourcePaths)");
                } else {
                    for (String p : paths) out.println("  " + p);
                }
            } catch (Throwable t) {
                out.println("  Could not read /WEB-INF/lib via ServletContext: " + t.getClass().getSimpleName() + " - " + t.getMessage());
            }
            out.println();

            out.println("NOTE: If no com.mysql.cj.jdbc.Driver appears above, your connector jar is not on the webapp classpath.");
            out.println("If the jar is present in WEB-INF/lib but driver not registered, try restarting Tomcat and ensure no duplicate connector in TOMCAT_HOME/lib.");
        }
    }
}