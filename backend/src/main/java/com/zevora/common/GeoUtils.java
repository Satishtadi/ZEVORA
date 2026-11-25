package com.zevora.common;

public final class GeoUtils {
    private static final double EARTH_RADIUS_KM = 6371.0088;

    private GeoUtils() {}

    public static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public static double routeDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        return haversineKm(lat1, lon1, lat2, lon2) * 1.25;
    }

    public static int durationMinutes(double distanceKm, double averageSpeedKmh) {
        if (averageSpeedKmh <= 0) return 0;
        return (int) Math.ceil((distanceKm / averageSpeedKmh) * 60);
    }

    public static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public static boolean validCoordinate(Double lat, Double lng) {
        return lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
}
