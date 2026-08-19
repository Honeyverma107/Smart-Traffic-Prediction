
from django.urls import path

from .views import (
    RouteView,
    SendOTPView,
    VerifyOTPView,
    GoogleLoginView,
    PredictCongestionView,
    TestEmailView,
    SignalTimingView,
    CurrentTrafficView,
)


urlpatterns = [

    path(
        "routes/",
        RouteView.as_view(),
        name="routes"
    ),

    path(
        "routes",
        RouteView.as_view()
    ),

    path(
        "route/",
        RouteView.as_view(),
        name="route"
    ),

    path(
        "route",
        RouteView.as_view()
    ),

    path(
        "send-otp/",
        SendOTPView.as_view(),
        name="send_otp"
    ),

    path(
        "send-otp",
        SendOTPView.as_view()
    ),

    path(
        "verify-otp/",
        VerifyOTPView.as_view(),
        name="verify_otp"
    ),

    path(
        "verify-otp",
        VerifyOTPView.as_view()
    ),

    path(
        "google-login/",
        GoogleLoginView.as_view(),
        name="google_login"
    ),

    path(
        "google-login",
        GoogleLoginView.as_view()
    ),

    path(
        "predict-congestion/",
        PredictCongestionView.as_view(),
        name="predict_congestion"
    ),

    path(
        "predict-congestion",
        PredictCongestionView.as_view()
    ),

    path(
        "signal-timing/",
        SignalTimingView.as_view(),
        name="signal_timing"
    ),

    path(
        "signal-timing",
        SignalTimingView.as_view()
    ),

    path(
        "traffic/current/",
        CurrentTrafficView.as_view(),
        name="traffic_current"
    ),

    path(
        "traffic/current",
        CurrentTrafficView.as_view()
    ),

    path(
        "test-email/",
        TestEmailView.as_view(),
        name="test_email"
    ),

    path(
        "test-email",
        TestEmailView.as_view()
    ),
]